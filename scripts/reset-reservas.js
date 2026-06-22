/**
 * Reset de reservas — apaga TODAS as reservas via API.
 *
 * Usa só o fetch nativo do Node 20 (sem dependências).
 *
 * ⚠️ DESTRUTIVO. Por padrão roda em "dry-run" (só mostra o que apagaria).
 *    Para apagar de verdade, defina CONFIRMA=SIM.
 *
 * Como rodar:
 *   RESERVA_API="http://academico3.rj.senac.br/20261prj5/hotel/reserva" node scripts/reset-reservas.js
 *   CONFIRMA=SIM RESERVA_API="http://academico3.rj.senac.br/20261prj5/hotel/reserva" node scripts/reset-reservas.js
 */

const BASE = (process.env.RESERVA_API || 'http://localhost:9532').replace(/\/$/, '');
const CONFIRMA = process.env.CONFIRMA === 'SIM';

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const txt = await res.text();
  let data;
  try { data = txt ? JSON.parse(txt) : null; } catch { data = txt; }
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
  return data;
}

async function main() {
  console.log(`\n🧹 Reset de reservas → ${BASE}`);
  if (BASE.includes('academico3')) console.log('⚠️  ATENÇÃO: apontando para o gateway de PRODUÇÃO.');
  console.log(CONFIRMA ? '🔴 MODO REAL: vai apagar de verdade.\n' : '🟡 DRY-RUN: nada será apagado (use CONFIRMA=SIM).\n');

  const reservas = await fetchJson(`${BASE}/reservas`).catch(() => []);
  const lista = Array.isArray(reservas) ? reservas : [];
  console.log(`Encontradas: ${lista.length} reservas.`);

  if (!CONFIRMA) { console.log('\n(DRY-RUN) Nada foi apagado.\n'); return; }

  let apagadas = 0;
  for (const r of lista) {
    const id = r.reserva_id ?? r.id;
    try { await fetchJson(`${BASE}/reservas/${id}`, { method: 'DELETE' }); apagadas++; console.log(`✓ reserva #${id} apagada`); }
    catch (e) { console.log(`✗ erro na reserva #${id}: ${e.message}`); }
  }
  console.log(`\n✅ Concluído: ${apagadas} reservas apagadas.\n`);
}

main().catch((e) => { console.error('Erro fatal:', e); process.exit(1); });
