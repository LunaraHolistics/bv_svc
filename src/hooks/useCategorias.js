// ============================================================================
// NOVO ARQUIVO: src/hooks/useCategorias.js
// Busca nichos ativos (ordenados) + contagem de serviços por nicho.
// ============================================================================
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const useCategorias = ({ comContagem = true } = {}) => {
  const [categorias, setCategorias] = useState([])
  const [contagens, setContagens] = useState({})
  const [loading, setLoading] = useState(true)

  const carregar = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('categorias_servico')
      .select('*')
      .eq('ativa', true)
      .order('ordem', { ascending: true })

    let cont = {}
    if (comContagem) {
      const { data: contData } = await supabase
        .from('servicos')
        .select('categoria_id')
        .not('categoria_id', 'is', null)
      ;(contData || []).forEach(s => {
        cont[s.categoria_id] = (cont[s.categoria_id] || 0) + 1
      })
    }

    setContagens(cont)
    setCategorias(data || [])
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  return { categorias, contagens, loading, recarregar: carregar }
}

export default useCategorias