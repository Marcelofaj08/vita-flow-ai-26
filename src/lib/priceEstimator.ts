/**
 * Estimativa de preços para a lista de compras (mercado PT, EUR).
 * Valores aproximados em €/kg, €/L ou €/unidade. Servem apenas como guia.
 */

type PriceRule = {
  match: RegExp;
  /** Preço base por unidade canónica (kg, L ou unidade) */
  pricePerUnit: number;
  /** Unidade do preço: "kg" | "L" | "un" */
  unit: "kg" | "L" | "un";
};

const PRICE_TABLE: PriceRule[] = [
  // Proteínas
  { match: /(peito de )?frango|peru/i, pricePerUnit: 6.5, unit: "kg" },
  { match: /carne|vaca|vitela|bife|porco|lombo/i, pricePerUnit: 11, unit: "kg" },
  { match: /salm[aã]o|atum|peixe|bacalhau|pescada|dourada|robalo/i, pricePerUnit: 12, unit: "kg" },
  { match: /ovos?/i, pricePerUnit: 0.35, unit: "un" },
  { match: /tofu|seit[aã]n|tempeh/i, pricePerUnit: 9, unit: "kg" },
  { match: /presunto|fiambre|bacon/i, pricePerUnit: 14, unit: "kg" },

  // Lacticínios
  { match: /leite/i, pricePerUnit: 0.95, unit: "L" },
  { match: /iogurte|skyr|kefir/i, pricePerUnit: 0.6, unit: "un" },
  { match: /queijo|requeij[aã]o|ricotta/i, pricePerUnit: 12, unit: "kg" },
  { match: /manteiga/i, pricePerUnit: 9, unit: "kg" },

  // Hidratos
  { match: /arroz/i, pricePerUnit: 1.5, unit: "kg" },
  { match: /massa|esparguete|macarr[aã]o|penne|fusilli/i, pricePerUnit: 1.2, unit: "kg" },
  { match: /p[aã]o|tostas?|wraps?|tortilhas?/i, pricePerUnit: 2.5, unit: "kg" },
  { match: /aveia|granola|cereais/i, pricePerUnit: 3, unit: "kg" },
  { match: /batata(?! doce)/i, pricePerUnit: 1.2, unit: "kg" },
  { match: /batata doce/i, pricePerUnit: 1.8, unit: "kg" },
  { match: /quinoa|cuscuz|bulgur/i, pricePerUnit: 5, unit: "kg" },
  { match: /lentilhas?|gr[aã]o|feij[aã]o/i, pricePerUnit: 2.5, unit: "kg" },

  // Frutas
  { match: /banana/i, pricePerUnit: 1.4, unit: "kg" },
  { match: /ma[çc][aã]/i, pricePerUnit: 1.7, unit: "kg" },
  { match: /laranja|tangerina|clementina/i, pricePerUnit: 1.3, unit: "kg" },
  { match: /pera/i, pricePerUnit: 1.9, unit: "kg" },
  { match: /morango|mirtilo|framboesa|frutos vermelhos/i, pricePerUnit: 8, unit: "kg" },
  { match: /abacate/i, pricePerUnit: 2.5, unit: "un" },
  { match: /kiwi|uvas?|melancia|mel[aã]o|ananás|abacaxi/i, pricePerUnit: 2.2, unit: "kg" },

  // Vegetais
  { match: /alface|rúcula|espinafres?|couve|br[oó]colos?|couve-flor/i, pricePerUnit: 2.5, unit: "kg" },
  { match: /tomate/i, pricePerUnit: 2, unit: "kg" },
  { match: /pepino|pimento|curgete|courgette|beringela|abóbora|cenoura|cebola|alho/i, pricePerUnit: 1.8, unit: "kg" },
  { match: /cogumelos?/i, pricePerUnit: 5, unit: "kg" },

  // Gorduras / extras
  { match: /azeite/i, pricePerUnit: 9, unit: "L" },
  { match: /[oó]leo/i, pricePerUnit: 3, unit: "L" },
  { match: /amend(o|ô)as?|nozes?|cajus?|pist[aá]cios?|frutos secos/i, pricePerUnit: 18, unit: "kg" },
  { match: /manteiga de amendoim|tahini/i, pricePerUnit: 12, unit: "kg" },
  { match: /sementes/i, pricePerUnit: 10, unit: "kg" },

  // Bebidas
  { match: /[aá]gua/i, pricePerUnit: 0.5, unit: "L" },
  { match: /chá|caf[eé]/i, pricePerUnit: 15, unit: "kg" },

  // Default fallback handled em getPriceRule
];

const DEFAULT_RULE: PriceRule = { match: /.*/, pricePerUnit: 4, unit: "kg" };

const getPriceRule = (name: string): PriceRule =>
  PRICE_TABLE.find((r) => r.match.test(name)) ?? DEFAULT_RULE;

/**
 * Converte o texto de quantidade ("500 g", "1.2kg", "2 un", "3-4 unidades", "1 L", "750 ml")
 * para um valor numérico na unidade canónica (kg, L ou un).
 * Devolve null se não conseguir interpretar.
 */
const parseQuantity = (qty: string): { amount: number; unit: "kg" | "L" | "un" } | null => {
  if (!qty) return null;
  const cleaned = qty.replace(",", ".").trim();
  const m = cleaned.match(/([\d.]+)(?:\s*[-–x×]\s*([\d.]+))?\s*([a-zA-ZçÇ]+)?/);
  if (!m) return null;
  const a = parseFloat(m[1]);
  const b = m[2] ? parseFloat(m[2]) : a;
  if (Number.isNaN(a)) return null;
  const value = (a + b) / 2;
  const u = (m[3] || "").toLowerCase();

  if (/^(kg|kgs|quilos?)$/.test(u)) return { amount: value, unit: "kg" };
  if (/^(g|gr|gramas?)$/.test(u)) return { amount: value / 1000, unit: "kg" };
  if (/^(l|lt|litros?)$/.test(u)) return { amount: value, unit: "L" };
  if (/^(ml|mls)$/.test(u)) return { amount: value / 1000, unit: "L" };
  if (/^(un|und|unid|unidades?|uni|pcs?|pe[çc]as?|d[uú]zias?)$/.test(u)) {
    return { amount: /d[uú]zias?/.test(u) ? value * 12 : value, unit: "un" };
  }
  // Sem unidade explícita → assume unidades
  if (!u) return { amount: value, unit: "un" };
  return null;
};

export type ItemEstimate = {
  price: number;
  pricePerUnit: number;
  unit: "kg" | "L" | "un";
  /** Quantidade interpretada na unidade canónica */
  amount: number;
  /** true se foi necessário recorrer a um valor por defeito */
  estimated: boolean;
};

export const estimateItemPrice = (name: string, quantity: string): ItemEstimate => {
  const rule = getPriceRule(name);
  const parsed = parseQuantity(quantity);

  let amount = 1;
  let estimated = false;

  if (parsed && parsed.unit === rule.unit) {
    amount = parsed.amount;
  } else if (parsed) {
    // Unidade não bate certo com a regra → faz um best-effort
    amount = parsed.amount;
    estimated = true;
  } else {
    // Sem quantidade → assume 1 unidade canónica
    amount = rule.unit === "kg" ? 0.5 : rule.unit === "L" ? 1 : 1;
    estimated = true;
  }

  const price = amount * rule.pricePerUnit;
  return {
    price: Math.max(0.2, Math.round(price * 100) / 100),
    pricePerUnit: rule.pricePerUnit,
    unit: rule.unit,
    amount,
    estimated,
  };
};

export const formatEUR = (value: number) =>
  new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value);

export const unitLabel = (u: "kg" | "L" | "un") =>
  u === "kg" ? "kg" : u === "L" ? "L" : "un.";