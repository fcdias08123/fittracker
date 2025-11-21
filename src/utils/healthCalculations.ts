/**
 * Funções para cálculos de saúde e nutrição
 */

export type IMCClassification = {
  value: number;
  label: string;
};

export type CaloriesResult = {
  calories: number;
  description: string;
};

export type MacrosResult = {
  carbs: number;
  protein: number;
  fat: number;
};

/**
 * Calcula o IMC (Índice de Massa Corporal)
 * @param peso Peso em kg
 * @param altura Altura em cm
 * @returns IMC com 1 casa decimal ou null se dados inválidos
 */
export function calcularIMC(peso: number | null, altura: number | null): number | null {
  if (!peso || !altura || peso <= 0 || altura <= 0) {
    return null;
  }
  
  const alturaMetros = altura / 100;
  const imc = peso / (alturaMetros * alturaMetros);
  
  return Math.round(imc * 10) / 10;
}

/**
 * Classifica o IMC em categorias
 * @param imc Valor do IMC
 * @returns Classificação do IMC
 */
export function classificarIMC(imc: number | null): string {
  if (imc === null) {
    return "Preencha seu peso e altura para ver o IMC";
  }
  
  if (imc < 18.5) {
    return "Abaixo do peso";
  } else if (imc < 25) {
    return "Peso normal";
  } else if (imc < 30) {
    return "Sobrepeso";
  } else {
    return "Obesidade";
  }
}

/**
 * Calcula a quantidade diária recomendada de água
 * @param peso Peso em kg
 * @returns Litros de água por dia com 1 casa decimal ou null se dados inválidos
 */
export function calcularAguaDiaria(peso: number | null): number | null {
  if (!peso || peso <= 0) {
    return null;
  }
  
  const mlAgua = peso * 35;
  const litros = mlAgua / 1000;
  
  return Math.round(litros * 10) / 10;
}

/**
 * Calcula as calorias diárias estimadas usando Mifflin-St Jeor
 * @param params Objeto com peso, altura, idade, sexo, nivel e objetivo
 * @returns Calorias diárias e descrição ou null se dados inválidos
 */
export function calcularCaloriasDiarias(params: {
  peso: number | null;
  altura: number | null;
  idade: number | null;
  sexo: string | null;
  nivel: string | null;
  objetivo: string | null;
}): CaloriesResult | null {
  const { peso, altura, idade, sexo, nivel, objetivo } = params;
  
  if (!peso || !altura || !idade || peso <= 0 || altura <= 0 || idade <= 0) {
    return null;
  }
  
  // Calcular TMB (Taxa Metabólica Basal) usando Mifflin-St Jeor
  let tmb: number;
  
  if (sexo === "Feminino") {
    tmb = 10 * peso + 6.25 * altura - 5 * idade - 161;
  } else {
    // Masculino ou outros (usar fórmula masculina como padrão)
    tmb = 10 * peso + 6.25 * altura - 5 * idade + 5;
  }
  
  // Fator de atividade baseado no nível
  let fatorAtividade = 1.55; // padrão intermediário
  
  if (nivel === "beginner" || nivel === "iniciante") {
    fatorAtividade = 1.375;
  } else if (nivel === "intermediate" || nivel === "intermediario" || nivel === "intermediário") {
    fatorAtividade = 1.55;
  } else if (nivel === "advanced" || nivel === "avancado" || nivel === "avançado") {
    fatorAtividade = 1.725;
  }
  
  // Calorias de manutenção
  let calorias = tmb * fatorAtividade;
  let description = "Para manter o peso com seu nível de atividade";
  
  // Ajuste por objetivo
  const objetivoLower = objetivo?.toLowerCase() || "";
  
  if (objetivoLower.includes("perder") || objetivoLower.includes("emagrecer") || objetivoLower.includes("gordura")) {
    calorias -= 300;
    description = "Para perda de peso com seu nível de atividade";
  } else if (objetivoLower.includes("ganhar") || objetivoLower.includes("massa")) {
    calorias += 300;
    description = "Para ganho de massa com seu nível de atividade";
  }
  
  return {
    calories: Math.round(calorias),
    description,
  };
}

/**
 * Calcula a distribuição de macronutrientes
 * @param params Objeto com calorias totais, peso e objetivo
 * @returns Gramas de carboidratos, proteínas e gorduras ou null se dados inválidos
 */
export function calcularMacros(params: {
  calorias: number;
  peso: number | null;
  objetivo: string | null;
}): MacrosResult | null {
  const { calorias, peso, objetivo } = params;
  
  if (!peso || peso <= 0 || !calorias || calorias <= 0) {
    return null;
  }
  
  const objetivoLower = objetivo?.toLowerCase() || "";
  
  let fatorProteina = 1.6; // padrão manter
  let fatorGordura = 1.0;
  
  // Ajustar fatores baseado no objetivo
  if (objetivoLower.includes("ganhar") || objetivoLower.includes("massa")) {
    fatorProteina = 2.0;
    fatorGordura = 1.0;
  } else if (objetivoLower.includes("perder") || objetivoLower.includes("emagrecer") || objetivoLower.includes("gordura")) {
    fatorProteina = 2.0;
    fatorGordura = 0.8;
  }
  
  // Calcular gramas de proteína e gordura
  const proteinaG = fatorProteina * peso;
  const gorduraG = fatorGordura * peso;
  
  // Calcular calorias de proteína e gordura
  const caloriasProteina = proteinaG * 4;
  const caloriasGordura = gorduraG * 9;
  
  // Calorias restantes vêm de carboidratos
  const caloriasCarbo = calorias - (caloriasProteina + caloriasGordura);
  const carboG = caloriasCarbo / 4;
  
  return {
    carbs: Math.round(Math.max(0, carboG)),
    protein: Math.round(proteinaG),
    fat: Math.round(gorduraG),
  };
}
