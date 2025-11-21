/**
 * Retorna a data de hoje no formato YYYY-MM-DD usando a data local do usuário
 */
export function getDataHojeLocalISODate(): string {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/**
 * Formata uma data ISO (YYYY-MM-DD) para português brasileiro
 * @param dataISO - String no formato YYYY-MM-DD
 * @returns Data formatada em português (ex: "20 de novembro de 2025")
 */
export function formatarDataPtBr(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split('-').map(Number);
  const date = new Date(ano, mes - 1, dia);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}
