// scripts/extract-kmz.js
const fs = require('fs')
const path = require('path')
const JSZip = require('jszip')
const { XMLParser } = require('fast-xml-parser')

// Instale as dependências: npm install jszip fast-xml-parser

async function extractKMZ(kmzPath, outputJsonPath) {
  try {
    // 1. Ler e descompactar KMZ
    const kmzBuffer = fs.readFileSync(kmzPath)
    const zip = await JSZip.loadAsync(kmzBuffer)
    
    // 2. Encontrar arquivo .kml dentro do ZIP
    const kmlFile = Object.keys(zip.files).find(f => f.endsWith('.kml'))
    if (!kmlFile) throw new Error('Arquivo .kml não encontrado no KMZ')
    
    const kmlContent = await zip.file(kmlFile).async('string')
    
    // 3. Parsear XML
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })
    const kmlData = parser.parse(kmlContent)
    
    // 4. Extrair Placemarks com coordenadas
    const placemarks = []
    const items = kmlData.kml.Document?.Placemark || []
    const placemarkArray = Array.isArray(items) ? items : [items]
    
    for (const pm of placemarkArray) {
      const name = pm.name
      const description = pm.description
      const coordinatesRaw = pm.Point?.coordinates
      
      if (coordinatesRaw) {
        const [lng, lat] = coordinatesRaw.split(',').map(Number)
        placemarks.push({
          name: name || 'Sem nome',
          description: description || '',
          latitude: lat,
          longitude: lng,
          // Coordenadas percentuais serão calculadas depois
          mapa_coords_x: null,
          mapa_coords_y: null
        })
      }
    }
    
    // 5. Salvar resultado
    fs.writeFileSync(outputJsonPath, JSON.stringify(placemarks, null, 2), 'utf-8')
    console.log(`✅ ${placemarks.length} coordenadas extraídas para ${outputJsonPath}`)
    return placemarks
    
  } catch (err) {
    console.error('❌ Erro ao extrair KMZ:', err.message)
    process.exit(1)
  }
}

// Uso: node scripts/extract-kmz.js ./mapa-condominio.kmz ./output/coords.json
const [_, __, kmzFile, outputFile] = process.argv
if (kmzFile && outputFile) {
  extractKMZ(kmzFile, outputFile)
}

module.exports = { extractKMZ }