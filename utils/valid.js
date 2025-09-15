function validEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validPassword(pw) {
  // Exemplo simples: >=6 chars. Ajusta se quiser mais segurança.
  return typeof pw === 'string' && pw.length >= 6;
}

module.exports = { validEmail, validPassword };