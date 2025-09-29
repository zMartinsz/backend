function validEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validPassword(pw) {
  // Exemplo simples: >=6 chars. Ajusta se quiser mais segurança.
  return typeof pw === 'string' && pw.length >= 6;
}
function ValidType(type){
  cargos = ["motorista_carro", "motorista_caminhao", "adm"]
    return cargos.includes(type)
}

function ValidDownload(role, tipo){
  if (role == "adm") return true;
  if (role === "motorista_caminhao" && tipo === "caminhao") return true;
  if (role === "motorista_veiculo" && tipo === "veiculo") return true;
  return false;
}
module.exports = { validEmail, validPassword, ValidType, ValidDownload };