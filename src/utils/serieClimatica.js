const MINUTO = 60 * 1000;

const pad = (n) => String(n).padStart(2, "0");
const media = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
const arredondar = (n) => Number(n.toFixed(1));

// O back guarda o horário do ThingSpeak em UTC (sem fuso): marcamos com "Z"
// para o navegador converter para o horário local.
export const paraDataLocal = (dataHora) => new Date(`${dataHora}Z`);

// A API espera data/hora ISO sem fuso, em UTC
export const paraParametro = (d) => d.toISOString().slice(0, 19);

// Regra do agrupamento (ajuste os números aqui se quiser outros valores)
function passoEmMinutos(duracaoMs) {
  if (duracaoMs <= 60 * MINUTO) return 10;       // até 1 hora: a cada 10 minutos
  if (duracaoMs <= 24 * 60 * MINUTO) return 30;  // de 1h a 24h: a cada 30 minutos
  return 60;                                     // mais de 24h: média por hora
}

function descricaoDoPasso(passo) {
  return passo === 60 ? "média por hora" : `média a cada ${passo} minutos`;
}

function rotulo(data, passo, duracaoMs) {
  if (passo < 60) return `${pad(data.getHours())}:${pad(data.getMinutes())}`;
  if (duracaoMs > 24 * 60 * MINUTO) {
    return `${pad(data.getDate())}/${pad(data.getMonth() + 1)} ${pad(data.getHours())}h`;
  }
  return `${pad(data.getHours())}h`;
}

// Transforma as leituras em pontos de gráfico: { pontos: [{label, temperatura, umidade}], descricao }
export function montarSerie(leituras) {
  if (!leituras || leituras.length === 0) return { pontos: [], descricao: "" };

  const itens = leituras
    .map((l) => ({ data: paraDataLocal(l.dataHora), temperatura: l.temperatura, umidade: l.umidade }))
    .sort((a, b) => a.data - b.data);

  const duracao = itens[itens.length - 1].data - itens[0].data;
  const passo = passoEmMinutos(duracao);
  const tamanho = passo * MINUTO;

  const grupos = new Map();
  itens.forEach((item) => {
    const chave = Math.floor(item.data.getTime() / tamanho) * tamanho;
    if (!grupos.has(chave)) grupos.set(chave, { temps: [], umids: [] });
    grupos.get(chave).temps.push(item.temperatura);
    grupos.get(chave).umids.push(item.umidade);
  });

  const pontos = [...grupos.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([chave, g]) => ({
      label: rotulo(new Date(chave), passo, duracao),
      temperatura: arredondar(media(g.temps)),
      umidade: arredondar(media(g.umids)),
    }));

  // Poucos minutos de dados: mostra cada leitura individual para o gráfico já aparecer
  if (pontos.length < 2 && itens.length >= 2) {
    return {
      pontos: itens.map((item) => ({
        label: `${pad(item.data.getHours())}:${pad(item.data.getMinutes())}:${pad(item.data.getSeconds())}`,
        temperatura: arredondar(item.temperatura),
        umidade: arredondar(item.umidade),
      })),
      descricao: "leituras individuais",
    };
  }

  return { pontos, descricao: descricaoDoPasso(passo) };
}