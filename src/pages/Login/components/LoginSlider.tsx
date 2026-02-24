// Componente de slider para a tela de login
import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLoginSlides } from '@/hooks/useLoginSlides'
import { Button } from '@/components/ui/button'

// Skeleton para carregamento
function SliderSkeleton() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center animate-pulse">
      {/* Imagem placeholder */}
      <div className="w-80 h-48 bg-white/20 rounded-xl mb-8" />

      {/* Título placeholder */}
      <div className="h-8 w-64 bg-white/20 rounded mb-4" />

      {/* Descrição placeholder */}
      <div className="h-4 w-80 bg-white/20 rounded mb-2" />
      <div className="h-4 w-72 bg-white/20 rounded mb-8" />

      {/* Dots placeholder */}
      <div className="flex gap-2">
        <div className="w-2 h-2 bg-white/20 rounded-full" />
        <div className="w-6 h-2 bg-white/30 rounded-full" />
        <div className="w-2 h-2 bg-white/20 rounded-full" />
      </div>
    </div>
  )
}

// Slide padrão quando não há slides cadastrados
function DefaultSlide() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-white px-8">
      {/* Logo ou imagem decorativa */}
      <div className="w-24 h-24 bg-primary/20 rounded-2xl flex items-center justify-center mb-8">
        <span className="text-4xl font-bold text-primary">A</span>
      </div>

      <h2 className="text-3xl font-bold text-center mb-4">
        Bem-vindo ao Allyra
      </h2>

      <p className="text-lg text-white/70 text-center max-w-md">
        Sistema completo de gestão para clínicas de saúde.
        Gerencie agenda, pacientes, financeiro e muito mais.
      </p>
    </div>
  )
}

interface LoginSliderProps {
  className?: string
}

export function LoginSlider({ className }: LoginSliderProps) {
  const { slides, config, isLoading } = useLoginSlides()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Auto-rotate
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length)
    }, config.intervalo_rotacao)

    return () => clearInterval(timer)
  }, [slides.length, config.intervalo_rotacao, isPaused])

  // Navegação manual
  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index)
    // Pausar temporariamente após navegação manual
    setIsPaused(true)
    setTimeout(() => setIsPaused(false), config.intervalo_rotacao * 2)
  }, [config.intervalo_rotacao])

  const goToPrevious = useCallback(() => {
    goToSlide(currentIndex === 0 ? slides.length - 1 : currentIndex - 1)
  }, [currentIndex, slides.length, goToSlide])

  const goToNext = useCallback(() => {
    goToSlide((currentIndex + 1) % slides.length)
  }, [currentIndex, slides.length, goToSlide])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevious()
      if (e.key === 'ArrowRight') goToNext()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToPrevious, goToNext])

  // Estados de loading e vazio
  if (isLoading) {
    return (
      <div className={cn('w-full h-full', className)}>
        <SliderSkeleton />
      </div>
    )
  }

  if (!slides.length) {
    return (
      <div className={cn('w-full h-full', className)}>
        <DefaultSlide />
      </div>
    )
  }

  const slide = slides[currentIndex]

  return (
    <div
      className={cn(
        'relative w-full h-full flex flex-col items-center justify-center',
        className
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Conteúdo do slide com transição */}
      <div
        key={slide.id}
        className="flex flex-col items-center justify-center text-white px-8 animate-in fade-in duration-500"
      >
        {/* Imagem/Mockup */}
        {slide.imagem_url && (
          <img
            src={slide.imagem_url}
            alt={slide.titulo}
            className="max-w-md max-h-64 object-contain rounded-xl shadow-2xl mb-8"
          />
        )}

        {/* Título */}
        <h2 className="text-3xl font-bold text-center mb-4 leading-tight">
          {slide.titulo}
        </h2>

        {/* Descrição */}
        {slide.descricao && (
          <p className="text-lg text-white/70 text-center max-w-md leading-relaxed">
            {slide.descricao}
          </p>
        )}

        {/* CTA Button */}
        {slide.botao_texto && slide.botao_link && (
          <a
            href={slide.botao_link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6"
          >
            <Button
              variant="outline"
              className="rounded-full px-6 border-white/30 text-white hover:bg-white/10"
            >
              {slide.botao_texto}
            </Button>
          </a>
        )}
      </div>

      {/* Navegação por setas (apenas se houver mais de 1 slide) */}
      {slides.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Slide anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Próximo slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dots de navegação */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              aria-label={`Ir para slide ${i + 1}`}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                i === currentIndex
                  ? 'bg-white w-6'
                  : 'bg-white/40 hover:bg-white/60 w-2'
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
