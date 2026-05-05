// scripts/merge-prestadores.js
/**
 * Script para cruzar dados do CSV do JotForm com coordenadas do KML do MyMaps
 * Executável em: Node.js local, Render, Vercel, Supabase Edge Functions
 * 
 * Uso: node scripts/merge-prestadores.js
 * Saída: src/data/prestadores-seed.json (pronto para import no Supabase)
 */

// Dependências nativas do Node.js (funcionam em qualquer ambiente serverless)
const fs = require('fs')
const path = require('path')

// Configurações
const CONFIG = {
  csvPath: './dados-jot.csv',
  kmlPath: './meu-mapa.kml', // ou .kmz descompactado
  outputPath: './src/data/prestadores-seed.json',
  // Limites geográficos aproximados do seu condomínio (ajuste conforme necessário)
  // Para descobrir: no Google MyMaps, clique nos cantos opostos e anote lat/lng
  mapBounds: {
    north: -21.7500, // Latitude máxima (norte)
    south: -21.7700, // Latitude mínima (sul)
    east: -48.1800,  // Longitude máxima (leste)
    west: -48.2000   // Longitude mínima (oeste)
  }
}

/**
 * Parse CSV simples (sem dependências externas)
 * Funciona com aspas e vírgulas dentro de campos
 */
function parseCSV(csvText) {
  const lines = []
  let currentLine = []
  let currentField = ''
  let inQuotes = false
  
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i]
    const nextChar = csvText[i + 1]
    
    if (char === '"' && nextChar === '"') {
      currentField += '"'
      i++ // Pula próxima aspa
      continue
    }
    
    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }
    
    if (char === ',' && !inQuotes) {
      currentLine.push(currentField.trim())
      currentField = ''
      continue
    }
    
    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (currentField || currentLine.length > 0) {
        currentLine.push(currentField.trim())
        lines.push(currentLine)
        currentLine = []
        currentField = ''
      }
      // Pula \r\n juntos
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
  
  // Converter para array de objetos
  if (lines.length === 0) return []
  
  const headers = lines[0].map(h => h.replace(/^"|"$/g, ''))
  const data = []
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (line.length === 1 && !line[0]) continue // Pula linhas vazias
    
    const obj = {}
    headers.forEach((header, index) => {
      obj[header] = (line[index] || '').replace(/^"|"$/g, '')
    })
    data.push(obj)
  }
  
  return data
}

/**
 * Extrair Placemarks do KML (formato simplificado)
 */
function parseKML(kmlText) {
  const placemarks = []
  
  // Regex para extrair Placemarks básicos (nome + coordinates)
  const placemarkRegex = /<Placemark>[\s\S]*?<name>([^<]+)<\/name>[\s\S]*?(?:<description>([\s\S]*?)<\/description>)?[\s\S]*?<coordinates>([^<]+)<\/coordinates>[\s\S]*?<\/Placemark>/g
  
  let match
  while ((match = placemarkRegex.exec(kmlText)) !== null) {
    const [, name, description, coordinatesRaw] = match
    
    if (coordinatesRaw) {
      const [lng, lat] = coordinatesRaw.trim().split(',').map(Number)
      if (!isNaN(lat) && !isNaN(lng)) {
        placemarks.push({
          name: name.trim(),
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
 * Converter lat/lng para coordenadas percentuais (X/Y) da imagem do mapa
 */
function latLngToPercent(lat, lng, bounds) {
  const x = ((lng - bounds.west) / (bounds.east - bounds.west)) * 100
  const y = ((bounds.north - lat) / (bounds.north - bounds.south)) * 100 // Y invertido: topo = 0%
  
  return {
    x: Math.max(0, Math.min(100, parseFloat(x.toFixed(2)))),
    y: Math.max(0, Math.min(100, parseFloat(y.toFixed(2))))
  }
}

/**
 * Normalizar nome para comparação (remover acentos, maiúsculas, etc)
 */
function normalizeName(name) {
  return (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
}

/**
 * Cruzar CSV + KML por nome ou casa_numero
 */
function mergeData(csvData, kmlData, bounds) {
  const results = []
  const usedKmlNames = new Set()
  
  for (const row of csvData) {
    // Filtrar apenas quem respondeu "Sim" para mapeamento
    const optInField = row['Se presta algum serviço, tem interesse que seja colocado no mapeamento do condomínio?']
    if (!optInField || optInField.toLowerCase() !== 'sim') {
      continue
    }
    
    // Filtrar quem tem serviço cadastrado
    const servicoField = row['Se SIM, qual(is) tipo(s) de serviço:']
    if (!servicoField || !servicoField.trim()) {
      continue
    }
    
    const nomeCSV = normalizeName(row['Nome completo'])
    const casaCSV = (row['Quadra / Lote / Fase'] || '').toLowerCase().trim()
    
    // Tentar encontrar correspondência no KML
    let coords = null
    
    for (const pin of kmlData) {
      const nomeKML = normalizeName(pin.name)
      
      // Critério 1: Nome similar
      if (nomeCSV.includes(nomeKML) || nomeKML.includes(nomeCSV) || nomeCSV === nomeKML) {
        coords = latLngToPercent(pin.latitude, pin.longitude, bounds)
        usedKmlNames.add(pin.name)
        break
      }
      
      // Critério 2: Casa_numero no description do pin (se houver)
      if (pin.description && casaCSV && pin.description.toLowerCase().includes(casaCSV)) {
        coords = latLngToPercent(pin.latitude, pin.longitude, bounds)
        usedKmlNames.add(pin.name)
        break
      }
    }
    
    // Montar registro para Supabase
    const registro = {
      id: crypto.randomUUID ? crypto.randomUUID() : `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      nome: row['Nome completo'],
      casa_numero: row['Quadra / Lote / Fase'],
      categoria: servicoField,
      whatsapp: (row['Contato/Whatsapp'] || '').replace(/\D/g, ''),
      opt_in: true,
      mapa_coords_x: coords?.x || null,
      mapa_coords_y: coords?.y || null,
      created_at: new Date().toISOString(),
      // Campos extras para referência
      _kml_matched: coords ? 'Sim' : 'Não',
      _kml_name: coords ? kmlData.find(p => 
        latLngToPercent(p.latitude, p.longitude, bounds).x === coords.x &&
        latLngToPercent(p.latitude, p.longitude, bounds).y === coords.y
      )?.name : null
    }
    
    results.push(registro)
  }
  
  return {
    prestadores: results,
    stats: {
      total_csv: csvData.length,
      com_opt_in: csvData.filter(r => r['Se presta algum serviço, tem interesse que seja colocado no mapeamento do condomínio?']?.toLowerCase() === 'sim').length,
      com_servico: results.length,
      com_coords: results.filter(r => r.mapa_coords_x !== null).length,
      sem_coords: results.filter(r => r.mapa_coords_x === null).length,
      kml_nao_usados: kmlData.filter(p => !usedKmlNames.has(p.name)).length
    }
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Iniciando merge de prestadores...')
  
  try {
    // 1. Ler arquivos
    console.log(`📄 Lendo CSV: ${CONFIG.csvPath}`)
    const csvText = fs.readFileSync(CONFIG.csvPath, 'utf-8')
    const csvData = parseCSV(csvText)
    
    console.log(`🗺️  Lendo KML: ${CONFIG.kmlPath}`)
    const kmlText = fs.readFileSync(CONFIG.kmlPath, 'utf-8')
    const kmlData = parseKML(kmlText)
    
    console.log(`📊 CSV: ${csvData.length} registros | KML: ${kmlData.length} pins`)
    
    // 2. Cruzar dados
    const { prestadores, stats } = mergeData(csvData, kmlData, CONFIG.mapBounds)
    
    // 3. Garantir pasta de saída
    const outputDir = path.dirname(CONFIG.outputPath)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
    
    // 4. Salvar resultado
    fs.writeFileSync(CONFIG.outputPath, JSON.stringify({ prestadores, stats }, null, 2), 'utf-8')
    
    // 5. Log de resultados
    console.log('\n✅ Merge concluído!')
    console.log(`📈 Estatísticas:`)
    console.log(`   • Total no CSV: ${stats.total_csv}`)
    console.log(`   • Com opt-in "Sim": ${stats.com_opt_in}`)
    console.log(`   • Com serviço preenchido: ${stats.com_servico}`)
    console.log(`   • ✅ Com coordenadas: ${stats.com_coords}`)
    console.log(`   • ⚠️ Sem coordenadas (precisa ajuste manual): ${stats.sem_coords}`)
    console.log(`   • Pins do KML não utilizados: ${stats.kml_nao_usados}`)
    console.log(`\n💾 Saída: ${CONFIG.outputPath}`)
    console.log(`\n🔧 Para importar no Supabase:`)
    console.log(`   1. Abra o arquivo gerado`)
    console.log(`   2. Copie o array "prestadores"`)
    console.log(`   3. No Supabase: Table Editor → anuncios_vendas → Insert → Import JSON`)
    
    return { prestadores, stats }
    
  } catch (err) {
    console.error('❌ Erro crítico:', err.message)
    console.error('\n💡 Dicas:')
    console.error('   • Verifique se os arquivos dados-jot.csv e meu-mapa.kml existem na raiz')
    console.error('   • Ajuste CONFIG.mapBounds com as coordenadas reais do seu condomínio')
    console.error('   • Para debug: adicione console.log() nas funções parseCSV/parseKML')
    process.exit(1)
  }
}

// Executar se chamado via CLI
if (require.main === module) {
  main()
}

module.exports = { parseCSV, parseKML, latLngToPercent, mergeData, main }