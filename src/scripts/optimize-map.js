// scripts/optimize-map.js
const sharp = require('sharp')
const path = require('path')

// Instale: npm install sharp

async function optimizeMap(inputPath, outputPath, options = {}) {
  const {
    width = 1920,        // Largura máxima
    quality = 80,        // Qualidade WebP (0-100)
    format = 'webp'      // 'webp' | 'avif' | 'jpg'
  } = options

  try {
    await sharp(inputPath)
      .resize(width, null, { 
        fit: 'inside', 
        withoutEnlargement: true 
      })
      .toFormat(format, { quality })
      .toFile(outputPath)
    
    const stats = fs.statSync(outputPath)
    console.log(`✅ Mapa otimizado: ${outputPath}`)
    console.log(`📦 Tamanho: ${(stats.size / 1024 / 1024).toFixed(2)} MB`)
    
  } catch (err) {
    console.error('❌ Erro na otimização:', err.message)
  }
}

// Uso: node scripts/optimize-map.js ./mapa-original.pdf ./public/mapa-condominio.webp
const [_, __, inputFile, outputFile] = process.argv
if (inputFile && outputFile) {
  optimizeMap(inputFile, outputFile)
}