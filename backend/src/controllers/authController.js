const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendResetCode } = require('../utils/mailer');

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    // chequear usuario existente
    const exists = await db.query('SELECT id FROM users WHERE email=$1', [email]);
    if (exists.rows.length) return res.status(400).json({ message: 'Correo ya registrado' });

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await db.query(
      'INSERT INTO users(name,email,password_hash) VALUES($1,$2,$3) RETURNING id, name, email, role',
      [name || null, email, password_hash]
    );
    res.status(201).json({ user: result.rows[0] });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const userQ = await db.query('SELECT id, name, email, password_hash, role FROM users WHERE email=$1', [email]);
    if (!userQ.rows.length) return res.status(400).json({ message: 'Credenciales inválidas' });
    const user = userQ.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(400).json({ message: 'Credenciales inválidas' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { next(err); }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const userQ = await db.query('SELECT id FROM users WHERE email=$1', [email]);

    // siempre respondemos 200 (no divulgamos existencia)
    if (!userQ.rows.length) return res.json({ message: 'Si existe una cuenta con ese correo, recibirás un código.' });

    const user = userQ.rows[0];
    const code = String(crypto.randomInt(100000, 999999)); // 6 dígitos
    const codeHash = await bcrypt.hash(code, SALT_ROUNDS);
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await db.query('UPDATE users SET reset_code_hash=$1, reset_code_expires=$2 WHERE id=$3', [codeHash, expires, user.id]);

    // enviar correo (no bloqueante idealmente, aquí simple)
    await sendResetCode(email, code);

    return res.json({ message: 'Si existe una cuenta con ese correo, recibirás un código.' });
  } catch (err) { next(err); }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { email, code, newPassword } = req.body;
    const userQ = await db.query('SELECT id, reset_code_hash, reset_code_expires FROM users WHERE email=$1', [email]);
    if (!userQ.rows.length) return res.status(400).json({ message: 'Código inválido o expirado' });

    const user = userQ.rows[0];
    if (!user.reset_code_hash || !user.reset_code_expires) return res.status(400).json({ message: 'Código inválido o expirado' });

    if (new Date(user.reset_code_expires) < new Date()) {
      return res.status(400).json({ message: 'Código expirado' });
    }

    const match = await bcrypt.compare(code, user.reset_code_hash);
    if (!match) return res.status(400).json({ message: 'Código inválido' });

    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await db.query('UPDATE users SET password_hash=$1, reset_code_hash=NULL, reset_code_expires=NULL WHERE id=$2', [newHash, user.id]);

    res.json({ message: 'Contraseña restablecida correctamente' });
  } catch (err) { next(err); }
};
