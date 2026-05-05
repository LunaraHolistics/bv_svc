// scripts/merge-prestadores.js
/**
 * Script para cruzar dados do CSV do JotForm com coordenadas do KML do MyMaps
 * Executável em: Node.js local, Render, Vercel, Supabase Edge Functions
 * 
 * Uso: node scripts/merge-prestadores.js
 * Saída: src/data/prestadores-seed.json (pronto para import no Supabase)
 */

// Dependências nativas do Node.js (zero dependências externas)
const fs = require('fs')
const path = require('path')

// Configurações com bounds REAIS do seu condomínio
const CONFIG = {
  csvPath: './dados-jot.csv',
  kmlPath: './meu-mapa.kml',
  outputPath: './src/data/prestadores-seed.json',
  
  // 🗺️ LIMITES GEOGRÁFICOS DO CONDOMÍNIO (calculados a partir dos pontos fornecidos)
  // Coordenadas: [latitude, longitude]
  mapBounds: {
    north: -21.817938943109898,  // Latitude máxima (ponto mais ao norte)
    south: -21.832211711079303,  // Latitude mínima (ponto mais ao sul)
    east: -48.1835637425173,     // Longitude máxima (ponto mais ao leste)
    west: -48.188988402410914    // Longitude mínima (ponto mais ao oeste)
  },
  
  // Filtros de qualidade
  minNameSimilarity: 0.6, // 60% de similaridade para match de nomes
  requireWhatsapp: false  // Se true, ignora registros sem WhatsApp válido
}

/**
 * Parse CSV robusto (sem dependências externas)
 * Suporta aspas, vírgulas dentro de campos e quebras de linha
 */
function parseCSV(csvText) {
  const lines = []
  let currentLine = []
  let currentField = ''
  let inQuotes = false
  
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i]
    const nextChar = csvText[i + 1]
    
    // Escape de aspas duplas
    if (char === '"' && nextChar === '"') {
      currentField += '"'
      i++
      continue
    }
    
    // Toggle de modo entre aspas
    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }
    
    // Separador de campo (vírgula fora de aspas)
    if (char === ',' && !inQuotes) {
      currentLine.push(currentField.trim())
      currentField = ''
      continue
    }
    
    // Separador de linha (\n ou \r\n fora de aspas)
    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (currentField || currentLine.length > 0) {
        currentLine.push(currentField.trim())
        lines.push(currentLine)
        currentLine = []
        currentField = ''
      }
      if (char === '\r' && nextChar === '\n') i++
      continue
    }
    
    currentField += char
  }
  
  // Última linha
  if (currentField || currentLine.length > 0) {
    currentLine.push(currentField.trim())
    lines.push(currentLine)
  }
  
  if (lines.length === 0) return []
  
  // Converter para array de objetos com headers
  const headers = lines[0].map(h => h.replace(/^"|"$/g, ''))
  const data = []
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (line.length === 1 && !line[0]) continue
    
    const obj = {}
    headers.forEach((header, index) => {
      obj[header] = (line[index] || '').replace(/^"|"$/g, '')
    })
    data.push(obj)
  }
  
  return data
}

/**
 * Extrair Placemarks do KML (formato Google MyMaps)
 */
function parseKML(kmlText) {
  const placemarks = []
  
  // Regex para Placemark com name + coordinates (suporta description opcional)
  const placemarkRegex = /<Placemark>[\s\S]*?<name>([^<]+)<\/name>(?:[\s\S]*?<description>([\s\S]*?)<\/description>)?[\s\S]*?<coordinates>([^<]+)<\/coordinates>[\s\S]*?<\/Placemark>/g
  
  let match
  while ((match = placemarkRegex.exec(kmlText)) !== null) {
    const [, name, description, coordinatesRaw] = match
    
    if (coordinatesRaw && coordinatesRaw.trim()) {
      const coords = coordinatesRaw.trim().split(',')
      const lng = parseFloat(coords[0])
      const lat = parseFloat(coords[1])
      
      if (!isNaN(lat) && !isNaN(lng)) {
        placemarks.push({
          name: (name || '').trim(),
          description: description ? description.trim().replace(/<[^>]*>/g, '') : '',
          latitude: lat,
          longitude: lng
        })
      }
    }
  }
  
  return placemarks
}

/**
 * Converter lat/lng → coordenadas percentuais (X/Y) da imagem do mapa
 * X: 0% = oeste, 100% = leste
 * Y: 0% = norte (topo), 100% = sul (base) - invertido porque CSS Y cresce para baixo
 */
function latLngToPercent(lat, lng, bounds) {
  const x = ((lng - bounds.west) / (bounds.east - bounds.west)) * 100
  const y = ((bounds.north - lat) / (bounds.north - bounds.south)) * 100
  
  return {
    x: Math.max(0, Math.min(100, parseFloat(x.toFixed(2)))),
    y: Math.max(0, Math.min(100, parseFloat(y.toFixed(2))))
  }
}

/**
 * Calcular similaridade entre strings (Levenshtein simplificado)
 */
function stringSimilarity(str1, str2) {
  const s1 = (str1 || '').toLowerCase().trim()
  const s2 = (str2 || '').toLowerCase().trim()
  
  if (s1 === s2) return 1.0
  if (!s1 || !s2) return 0.0
  
  // Verificar se um contém o outro
  if (s1.includes(s2) || s2.includes(s1)) {
    return Math.max(s1.length, s2.length) / Math.min(s1.length, s2.length) * 0.8
  }
  
  // Similaridade por tokens (nomes compostos)
  const tokens1 = s1.split(/\s+/).filter(t => t.length > 2)
  const tokens2 = s2.split(/\s+/).filter(t => t.length > 2)
  
  if (tokens1.length === 0 || tokens2.length === 0) return 0.0
  
  const matches = tokens1.filter(t1 => tokens2.some(t2 => t1.includes(t2) || t2.includes(t1)))
  return matches.length / Math.max(tokens1.length, tokens2.length)
}

/**
 * Normalizar nome para comparação (remover acentos, pontuação, etc)
 */
function normalizeName(name) {
  return (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Cruzar CSV + KML por nome/casa com tolerância a variações
 */
function mergeData(csvData, kmlData, bounds, config) {
  const results = []
  const usedKmlNames = new Set()
  
  for (const row of csvData) {
    // Filtro 1: Opt-in para mapeamento
    const optInField = row['Se presta algum serviço, tem interesse que seja colocado no mapeamento do condomínio?']
    if (!optInField || optInField.toLowerCase().trim() !== 'sim') {
      continue
    }
    
    // Filtro 2: Tem serviço cadastrado
    const servicoField = row['Se SIM, qual(is) tipo(s) de serviço:']
    if (!servicoField || !servicoField.trim()) {
      continue
    }
    
    // Filtro 3: WhatsApp (opcional)
    if (config.requireWhatsapp) {
      const whatsapp = (row['Contato/Whatsapp'] || '').replace(/\D/g, '')
      if (whatsapp.length < 10) continue
    }
    
    const nomeCSV = normalizeName(row['Nome completo'])
    const casaCSV = (row['Quadra / Lote / Fase'] || '').toLowerCase().trim()
    const whatsappRaw = row['Contato/Whatsapp'] || ''
    
    // Tentar encontrar correspondência no KML
    let bestMatch = null
    let bestScore = 0
    
    for (const pin of kmlData) {
      const nomeKML = normalizeName(pin.name)
      
      // Critério 1: Similaridade de nome
      const nameScore = stringSimilarity(nomeCSV, nomeKML)
      
      // Critério 2: Casa no description do pin
      const descHasCasa = pin.description && casaCSV && 
        pin.description.toLowerCase().includes(casaCSV)
      
      // Score combinado
      let score = nameScore
      if (descHasCasa) score = Math.max(score, 0.9)
      
      if (score > bestScore && score >= config.minNameSimilarity) {
        bestScore = score
        bestMatch = pin
      }
    }
    
    // Converter coordenadas se encontrou match
    let coords = null
    if (bestMatch) {
      coords = latLngToPercent(bestMatch.latitude, bestMatch.longitude, bounds)
      usedKmlNames.add(bestMatch.name)
    }
    
    // Limpar WhatsApp para formato internacional
    const whatsappClean = whatsappRaw.replace(/\D/g, '')
    const whatsappFormatted = whatsappClean.length >= 11 
      ? `55${whatsappClean}` 
      : whatsappClean
    
    // Montar registro para Supabase (schema prestadores_servico)
    const registro = {
      id: crypto?.randomUUID ? crypto.randomUUID() : `seed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      nome: (row['Nome completo'] || '').trim(),
      casa_numero: (row['Quadra / Lote / Fase'] || '').trim(),
      categoria: servicoField.trim(),
      whatsapp: whatsappFormatted,
      opt_in: true,
      mapa_coords_x: coords?.x || null,
      mapa_coords_y: coords?.y || null,
      created_at: new Date().toISOString(),
      // Metadados para auditoria
      _meta: {
        kml_matched: bestMatch ? 'Sim' : 'Não',
        kml_name: bestMatch?.name || null,
        match_score: bestScore.toFixed(2),
        csv_nome_normalized: nomeCSV,
        csv_casa_normalized: casaCSV
      }
    }
    
    results.push(registro)
  }
  
  return {
    prestadores: results,
    stats: {
      total_csv: csvData.length,
      com_opt_in: csvData.filter(r => 
        r['Se presta algum serviço, tem interesse que seja colocado no mapeamento do condomínio?']?.toLowerCase().trim() === 'sim'
      ).length,
      com_servico_preenchido: results.length,
      com_coords: results.filter(r => r.mapa_coords_x !== null).length,
      sem_coords: results.filter(r => r.mapa_coords_x === null).length,
      com_whatsapp: results.filter(r => r.whatsapp.length >= 10).length,
      kml_total: kmlData.length,
      kml_usados: usedKmlNames.size,
      kml_nao_usados: kmlData.filter(p => !usedKmlNames.has(p.name)).length
    }
  }
}

/**
 * Função principal - executável via CLI ou import
 */
async function main() {
  console.log('🚀 Merge Prestadores - Condomínio BV Service')
  console.log('='.repeat(50))
  
  try {
    // Validar arquivos de entrada
    if (!fs.existsSync(CONFIG.csvPath)) {
      throw new Error(`Arquivo não encontrado: ${CONFIG.csvPath}`)
    }
    if (!fs.existsSync(CONFIG.kmlPath)) {
      throw new Error(`Arquivo não encontrado: ${CONFIG.kmlPath}`)
    }
    
    // 1. Ler e parsear CSV
    console.log(`📄 Lendo CSV: ${CONFIG.csvPath}`)
    const csvText = fs.readFileSync(CONFIG.csvPath, 'utf-8')
    const csvData = parseCSV(csvText)
    console.log(`   ✓ ${csvData.length} registros encontrados`)
    
    // 2. Ler e parsear KML
    console.log(`🗺️  Lendo KML: ${CONFIG.kmlPath}`)
    const kmlText = fs.readFileSync(CONFIG.kmlPath, 'utf-8')
    const kmlData = parseKML(kmlText)
    console.log(`   ✓ ${kmlData.length} placemarks encontrados`)
    
    // 3. Cruzar dados
    console.log(`🔗 Cruzando dados com bounds:`)
    console.log(`   N: ${CONFIG.mapBounds.north.toFixed(6)}, S: ${CONFIG.mapBounds.south.toFixed(6)}`)
    console.log(`   E: ${CONFIG.mapBounds.east.toFixed(6)}, W: ${CONFIG.mapBounds.west.toFixed(6)}`)
    
    const { prestadores, stats } = mergeData(csvData, kmlData, CONFIG.mapBounds, CONFIG)
    
    // 4. Garantir pasta de saída
    const outputDir = path.dirname(CONFIG.outputPath)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
      console.log(`📁 Pasta criada: ${outputDir}`)
    }
    
    // 5. Salvar resultado
    fs.writeFileSync(CONFIG.outputPath, JSON.stringify({ prestadores, stats }, null, 2), 'utf-8')
    
    // 6. Relatório final
    console.log('\n✅ Merge concluído com sucesso!')
    console.log('\n📊 Estatísticas:')
    console.log(`   • Total no CSV: ${stats.total_csv}`)
    console.log(`   • Com opt-in "Sim": ${stats.com_opt_in}`)
    console.log(`   • Com serviço válido: ${stats.com_servico_preenchido}`)
    console.log(`   • ✅ Com coordenadas: ${stats.com_coords}`)
    console.log(`   • ⚠️ Sem coordenadas (ajuste manual): ${stats.sem_coords}`)
    console.log(`   • 📱 Com WhatsApp válido: ${stats.com_whatsapp}`)
    console.log(`   • 🗺️ Pins KML usados: ${stats.kml_usados}/${stats.kml_total}`)
    
    console.log(`\n💾 Saída: ${CONFIG.outputPath}`)
    
    console.log(`\n🔧 Para importar no Supabase:`)
    console.log(`   1. Abra o arquivo gerado`)
    console.log(`   2. Copie o array "prestadores"`)
    console.log(`   3. No Supabase Dashboard: Table Editor → prestadores_servico → Insert → Import JSON`)
    console.log(`   4. Ou use SQL: INSERT INTO prestadores_servico (...) VALUES ...`)
    
    // Listar registros sem coordenadas para ajuste manual
    if (stats.sem_coords > 0) {
      console.log(`\n⚠️ Registros sem coordenadas (precisam de ajuste manual):`)
      prestadores
        .filter(p => p.mapa_coords_x === null)
        .slice(0, 5)
        .forEach(p => {
          console.log(`   • ${p.nome} | Casa: ${p.casa_numero} | Match: ${p._meta.match_score}`)
        })
      if (stats.sem_coords > 5) {
        console.log(`   ... e mais ${stats.sem_coords - 5} registros`)
      }
    }
    
    return { prestadores, stats }
    
  } catch (err) {
    console.error('\n❌ Erro crítico:', err.message)
    console.error('\n💡 Soluções:')
    console.error('   1. Verifique se dados-jot.csv e meu-mapa.kml estão na raiz do projeto')
    console.error('   2. Confirme que o KML foi extraído do KMZ (renomeie .kmz → .zip → extraia)')
    console.error('   3. Para debug: execute com "node --inspect scripts/merge-prestadores.js"')
    process.exit(1)
  }
}

// Executar se chamado via CLI
if (require.main === module) {
  main()
}

// Exportar para uso como módulo (Edge Functions, testes, etc)
module.exports = { 
  parseCSV, 
  parseKML, 
  latLngToPercent, 
  stringSimilarity,
  mergeData, 
  main,
  CONFIG 
}