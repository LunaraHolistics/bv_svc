// scripts/extract-kmz.js
const fs = require('fs')
const path = require('path')
const JSZip = require('jszip')
const { XMLParser } = require('fast-xml-parser')

async function extractKMZ(kmzPath, outputJsonPath) {
  try {
    console.log(`📦 Lendo KMZ: ${kmzPath}`)
    const kmzBuffer = fs.readFileSync(kmzPath)
    const zip = await JSZip.loadAsync(kmzBuffer)
    
    const kmlFile = Object.keys(zip.files).find(f => f.endsWith('.kml'))
    if (!kmlFile) throw new Error('Arquivo .kml não encontrado no KMZ')
    
    console.log(`🔍 Encontrado: ${kmlFile}`)
    const kmlContent = await zip.file(kmlFile).async('string')
    
    const parser = new XMLParser({ 
      ignoreAttributes: false, 
      attributeNamePrefix: '@_',
      allowBooleanAttributes: true
    })
    const kmlData = parser.parse(kmlContent)
    
    const placemarks = []
    const items = kmlData.kml?.Document?.Placemark || []
    const placemarkArray = Array.isArray(items) ? items : [items].filter(Boolean)
    
    console.log(`📍 Processando ${placemarkArray.length} placemarks...`)
    
    for (const pm of placemarkArray) {
      const name = pm.name
      const description = pm.description
      const coordinatesRaw = pm.Point?.coordinates
      
      if (coordinatesRaw && typeof coordinatesRaw === 'string') {
        const [lng, lat] = coordinatesRaw.split(',').map(Number)
        if (!isNaN(lat) && !isNaN(lng)) {
          placemarks.push({
            name: name || 'Sem nome',
            description: typeof description === 'string' ? description : '',
            latitude: lat,
            longitude: lng,
            mapa_coords_x: null,
            mapa_coords_y: null
          })
        }
      }
    }
    
    // Garantir que a pasta de saída existe
    const outputDir = path.dirname(outputJsonPath)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
    
    fs.writeFileSync(outputJsonPath, JSON.stringify(placemarks, null, 2), 'utf-8')
    console.log(`✅ Sucesso! ${placemarks.length} coordenadas salvas em ${outputJsonPath}`)
    return placemarks
    
  } catch (err) {
    console.error('❌ Erro crítico:', err.message)
    console.error('💡 Dica: Verifique se o arquivo KMZ existe e se as dependências estão instaladas')
    process.exit(1)
  }
}

// Execução via CLI
const [_, __, kmzFile, outputFile] = process.argv
if (kmzFile && outputFile) {
  console.log('🚀 Iniciando extração do KMZ...')
  extractKMZ(kmzFile, outputFile)
} else {
  console.log('Uso: node scripts/extract-kmz.js <arquivo.kmz> <saida.json>')
}

module.exports = { extractKMZ }