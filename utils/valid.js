function validEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validCPF(cpf) {
  cpf = cpf.replace(/[^\d]+/g, ''); // remove pontuação
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  let soma = 0, resto;
  for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;

  soma = 0;
  for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === parseInt(cpf.substring(10, 11));
}


function validPassword(pw) {
  // Exemplo simples: >=6 chars. Ajusta se quiser mais segurança.
  return typeof pw === 'string' && pw.length >= 6;
}
function ValidType(type){
  cargos = ["motorista_carro", "motorista_caminhao", "adm"]
    return cargos.includes(type)
}
function ValidEmpresa(empresa){
  empresas = ["Telsite", "Mas", "Paros", "Filial"]
  return empresas.includes(empresa)
}
function ValidDownload(role, tipo){
  if (role == "adm") return true;
  if (role === "motorista_caminhao" && tipo === "caminhao") return true;
  if (role === "motorista_veiculo" && tipo === "veiculo") return true;
  return false;
}

module.exports = { validEmail, validPassword, ValidType, ValidEmpresa, ValidDownload, validCPF };
