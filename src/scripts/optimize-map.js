// scripts/optimize-map.js
const fs = require('fs')
const path = require('path')

// Verificar se sharp está instalado
let sharp
try {
  sharp = require('sharp')
} catch (e) {
  console.error('❌ Dependência "sharp" não encontrada.')
  console.error('💡 Execute: npm install sharp')
  process.exit(1)
}

async function optimizeMap(inputPath, outputPath, options = {}) {
  const {
    width = 1920,
    quality = 80,
    format = 'webp'
  } = options

  try {
    console.log(`🖼️  Otimizando: ${inputPath}`)
    
    // Verificar se arquivo de entrada existe
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Arquivo não encontrado: ${inputPath}`)
    }

    // Garantir pasta de saída
    const outputDir = path.dirname(outputPath)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    await sharp(inputPath)
      .resize(width, null, { 
        fit: 'inside', 
        withoutEnlargement: true 
      })
      .toFormat(format, { quality })
      .toFile(outputPath)
    
    const stats = fs.statSync(outputPath)
    const originalStats = fs.statSync(inputPath)
    
    console.log(`✅ Mapa otimizado com sucesso!`)
    console.log(`📦 Original: ${(originalStats.size / 1024 / 1024).toFixed(2)} MB`)
    console.log(`📦 Otimizado: ${(stats.size / 1024 / 1024).toFixed(2)} MB`)
    console.log(`📍 Salvo em: ${outputPath}`)
    
  } catch (err) {
    console.error('❌ Erro na otimização:', err.message)
    if (err.message.includes('unsupported image format')) {
      console.error('💡 Dica: Converta seu PDF para PNG/JPG primeiro usando https://iloveimg.com/pt')
    }
    process.exit(1)
  }
}

// CLI
const [_, __, inputFile, outputFile] = process.argv
if (inputFile && outputFile) {
  console.log('🚀 Iniciando otimização do mapa...')
  optimizeMap(inputFile, outputFile)
} else {
  console.log('Uso: node scripts/optimize-map.js <entrada.pdf|png|jpg> <saida.webp>')
}