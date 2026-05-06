import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

const formatarPreco = (valor) => {
  if (!valor) return ''

  const numero = parseFloat(valor)

  if (isNaN(numero)) return ''

  return numero.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}

const extrairPathStorage = (url) => {
  if (!url) return null

  try {
    const partes = url.split('/storage/v1/object/public/anuncios/')
    return partes[1] || null
  } catch {
    return null
  }
}

const EditarAnuncioPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    titulo: '',
    preco: '',
    descricao: '',
    status: 'Ativo',
    data_expiracao: ''
  })

  const [imagemPreview, setImagemPreview] = useState(null)
  const [imagemFile, setImagemFile] = useState(null)
  const [imagemExistente, setImagemExistente] = useState(null)

  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [error, setError] = useState(null)
  const [sucesso, setSucesso] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    buscarAnuncio()
  }, [id, user])

  const buscarAnuncio = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('anuncios_vendas')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      if (!data) {
        setError('Anúncio não encontrado.')
        return
      }

      if (data.usuario_id && data.usuario_id !== user.id) {
        setError('Você não tem permissão para editar este anúncio.')
        return
      }

      setForm({
        titulo: data.titulo || '',
        preco: data.preco || '',
        descricao: data.descricao || '',
        status: data.status || 'Ativo',
        data_expiracao: data.data_expiracao
          ? data.data_expiracao.slice(0, 10)
          : ''
      })

      setImagemExistente(data.imagem_url || null)
    } catch (err) {
      console.error(err)
      setError('Erro ao carregar anúncio.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }))

    if (error) setError(null)
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Envie apenas arquivos de imagem.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 5MB.')
      return
    }

    setImagemFile(file)
    setError(null)

    const reader = new FileReader()

    reader.onloadend = () => {
      setImagemPreview(reader.result)
    }

    reader.readAsDataURL(file)
  }

  const removerImagemNova = () => {
    setImagemPreview(null)
    setImagemFile(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadNovaImagem = async () => {
    if (!imagemFile) return imagemExistente

    const ext = imagemFile.name.split('.').pop()
    const filePath = `anuncios/${id}-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('anuncios')
      .upload(filePath, imagemFile, {
        contentType: imagemFile.type
      })

    if (uploadError) throw uploadError

    if (imagemExistente) {
      const oldPath = extrairPathStorage(imagemExistente)

      if (oldPath) {
        await supabase.storage
          .from('anuncios')
          .remove([oldPath])
      }
    }

    const {
      data: { publicUrl }
    } = supabase.storage
      .from('anuncios')
      .getPublicUrl(filePath)

    return publicUrl
  }

  const handleSalvar = async (e) => {
    e.preventDefault()

    if (salvando) return

    try {
      setSalvando(true)
      setError(null)

      if (!form.titulo.trim()) {
        throw new Error('Informe um título.')
      }

      if (!form.descricao.trim()) {
        throw new Error('Informe uma descrição.')
      }

      if (!form.preco || parseFloat(form.preco) <= 0) {
        throw new Error('Informe um preço válido.')
      }

      const imagemUrlFinal = await uploadNovaImagem()

      const { error } = await supabase
        .from('anuncios_vendas')
        .update({
          titulo: form.titulo.trim(),
          preco: parseFloat(form.preco),
          descricao: form.descricao.trim(),
          status: form.status,
          imagem_url: imagemUrlFinal,
          data_expiracao: form.data_expiracao
            ? new Date(form.data_expiracao).toISOString()
            : null
        })
        .eq('id', id)

      if (error) throw error

      setSucesso(true)

      setTimeout(() => {
        navigate('/anuncios')
      }, 1800)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Erro ao salvar anúncio.')
    } finally {
      setSalvando(false)
    }
  }

  const handleExcluir = async () => {
    const confirmar = window.confirm(
      'Deseja realmente excluir este anúncio?'
    )

    if (!confirmar) return

    try {
      setSalvando(true)
      setError(null)

      if (imagemExistente) {
        const imagePath = extrairPathStorage(imagemExistente)

        if (imagePath) {
          await supabase.storage
            .from('anuncios')
            .remove([imagePath])
        }
      }

      const { error } = await supabase
        .from('anuncios_vendas')
        .delete()
        .eq('id', id)

      if (error) throw error

      navigate('/anuncios')
    } catch (err) {
      console.error(err)
      setError('Erro ao excluir anúncio.')
      setSalvando(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
      </div>
    )
  }

  if (sucesso) {
    return (
      <div className="text-center py-24">
        <div className="text-6xl mb-4">🎉</div>

        <h2 className="text-2xl font-bold text-gray-900">
          Anúncio atualizado com sucesso
        </h2>

        <p className="text-gray-500 mt-2">
          Redirecionando...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-800 text-white p-8">
        <Link
          to="/anuncios"
          className="text-sm text-emerald-200 no-underline"
        >
          ← Voltar para anúncios
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold mt-4">
          Editar anúncio
        </h1>

        <p className="text-slate-200 mt-2 max-w-xl">
          Atualize seu anúncio e mantenha ele competitivo.
        </p>
      </section>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <form
          onSubmit={handleSalvar}
          className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Foto do produto
            </label>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center cursor-pointer hover:border-emerald-500 transition"
            >
              {imagemPreview || imagemExistente ? (
                <img
                  src={imagemPreview || imagemExistente}
                  alt="Preview"
                  className="w-full max-h-80 object-cover rounded-2xl"
                />
              ) : (
                <>
                  <div className="text-5xl mb-3">📷</div>
                  <p className="text-gray-500 text-sm">
                    Clique para enviar nova imagem
                  </p>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />

            {imagemPreview && (
              <button
                type="button"
                onClick={removerImagemNova}
                className="mt-3 text-red-500 text-sm font-medium"
              >
                Remover nova imagem
              </button>
            )}
          </div>

          <input
            type="text"
            name="titulo"
            value={form.titulo}
            onChange={handleChange}
            placeholder="Título"
            className="w-full px-4 py-3 border border-gray-200 rounded-2xl"
          />

          <div>
            <input
              type="number"
              name="preco"
              value={form.preco}
              onChange={handleChange}
              placeholder="Preço"
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl"
            />

            {form.preco && (
              <p className="text-emerald-600 text-sm font-medium mt-2">
                {formatarPreco(form.preco)}
              </p>
            )}
          </div>

          <textarea
            name="descricao"
            rows="5"
            value={form.descricao}
            onChange={handleChange}
            placeholder="Descrição"
            className="w-full px-4 py-3 border border-gray-200 rounded-2xl"
          />

          <div className="grid md:grid-cols-2 gap-4">
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl"
            >
              <option value="Ativo">Ativo</option>
              <option value="Vendido">Vendido</option>
              <option value="Expirado">Expirado</option>
            </select>

            <input
              type="date"
              name="data_expiracao"
              value={form.data_expiracao}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={salvando}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-2xl font-semibold"
            >
              {salvando ? 'Salvando...' : 'Salvar alterações'}
            </button>

            <button
              type="button"
              onClick={handleExcluir}
              disabled={salvando}
              className="px-5 py-3 border border-red-200 text-red-600 rounded-2xl hover:bg-red-50"
            >
              Excluir anúncio
            </button>
          </div>
        </form>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 h-fit">
          <h3 className="font-bold text-gray-900 text-lg">
            Dicas rápidas
          </h3>

          <ul className="mt-4 space-y-3 text-sm text-gray-500">
            <li>✓ Use boas fotos</li>
            <li>✓ Seja honesto na descrição</li>
            <li>✓ Preço justo vende mais rápido</li>
            <li>✓ Responda rápido interessados</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default EditarAnuncioPage