/**
 * Serviço de Configurações da Clínica
 * Gerencia todas as configurações operacionais, comunicação, aparência e faturamento
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { success, error, simulateDelay } from './base.service'
import type { ServiceResponse } from './types'

// =====================================================
// TIPOS DO BANCO
// =====================================================

export interface ConfiguracaoClinicaDB {
  id: string
  clinica_id: string
  horario_funcionamento: Record<string, unknown>
  tempo_antecedencia_agendamento: number
  tempo_cancelamento: number
  permite_agendamento_online: boolean
  notificacao_lembrete_horas: number
  notificacao_confirmacao_dias: number
  campos_obrigatorios_paciente: string[]
  configuracoes_whatsapp: Record<string, unknown>
  configuracoes_email: Record<string, unknown>
  created_at: string
  updated_at: string
}

// =====================================================
// TIPOS FORMATADOS PARA FRONTEND
// =====================================================

export interface ConfiguracaoFormatted {
  id: string
  clinicaId: string
  // Operacional
  horarioFuncionamento: Record<string, unknown>
  tempoAntecedenciaAgendamento: number
  tempoCancelamento: number
  permiteAgendamentoOnline: boolean
  // Notificações/Comunicação
  notificacaoLembreteHoras: number
  notificacaoConfirmacaoDias: number
  configuracoesWhatsapp: Record<string, unknown>
  configuracoesEmail: Record<string, unknown>
  // Cadastro Rápido
  camposObrigatoriosPaciente: string[]
  // Timestamps
  createdAt: string
  updatedAt: string
}

// Tipos para input de atualização
export interface UpdatePadraoInput {
  planoContaPadrao?: string
}

export interface UpdateOperacionalInput {
  recepcaoFinaliza?: boolean
  marcacaoRetroativa?: number
  prontuarioRetroativo?: number
  tempoMinimo?: number
  incrementar?: number
  tempoMaximo?: number
}

export interface UpdateComunicacaoInput {
  enviarSmsMarcar?: boolean
  solicitarConfirmacao?: boolean
}

export interface UpdateFaturamentoInput {
  imposto?: number
  unificarTitulos?: boolean
  plataforma?: string
  notificacao?: string
  enviarFatura?: string
  diaVencimento?: number
}

export interface UpdateAparenciaInput {
  logoUrl?: string
  nomeEmpresa?: string
  corPrimaria?: string
}

export interface UpdatePermissoesInput {
  role: string
  permissions: Record<string, boolean>
}

export interface UpdateCadastroRapidoInput {
  campos: Array<{
    id: string
    enabled: boolean
    required: boolean
    saveToProfile: boolean
  }>
}

// =====================================================
// FUNÇÕES DE CONVERSÃO
// =====================================================

function formatConfiguracao(c: ConfiguracaoClinicaDB): ConfiguracaoFormatted {
  return {
    id: c.id,
    clinicaId: c.clinica_id,
    horarioFuncionamento: c.horario_funcionamento || {},
    tempoAntecedenciaAgendamento: c.tempo_antecedencia_agendamento,
    tempoCancelamento: c.tempo_cancelamento,
    permiteAgendamentoOnline: c.permite_agendamento_online,
    notificacaoLembreteHoras: c.notificacao_lembrete_horas,
    notificacaoConfirmacaoDias: c.notificacao_confirmacao_dias,
    configuracoesWhatsapp: c.configuracoes_whatsapp || {},
    configuracoesEmail: c.configuracoes_email || {},
    camposObrigatoriosPaciente: c.campos_obrigatorios_paciente || [],
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  }
}

// =====================================================
// SERVIÇO
// =====================================================

class ConfigurationsService {
  // Buscar configurações da clínica
  async getConfigurations(clinicaId: string): Promise<ServiceResponse<ConfiguracaoFormatted>> {
    if (!isSupabaseConfigured || !supabase) {
      await simulateDelay()
      return error('Supabase não configurado', 'SUPABASE_NOT_CONFIGURED')
    }

    try {
      const { data, error: dbError } = await supabase
        .from('configuracoes_clinica')
        .select('*')
        .eq('clinica_id', clinicaId)
        .maybeSingle()

      if (dbError) {
        return error(dbError.message, dbError.code)
      }

      // Se não existe, criar configuração padrão
      if (!data) {
        return await this.createDefaultConfiguration(clinicaId)
      }

      return success(formatConfiguracao(data as ConfiguracaoClinicaDB))
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao buscar configurações', 'UNKNOWN_ERROR')
    }
  }

  // Criar configuração padrão
  private async createDefaultConfiguration(clinicaId: string): Promise<ServiceResponse<ConfiguracaoFormatted>> {
    if (!supabase) {
      return error('Supabase não configurado', 'SUPABASE_NOT_CONFIGURED')
    }

    try {
      const { data, error: dbError } = await supabase
        .from('configuracoes_clinica')
        .insert({
          clinica_id: clinicaId,
          horario_funcionamento: {},
          tempo_antecedencia_agendamento: 1,
          tempo_cancelamento: 24,
          permite_agendamento_online: true,
          notificacao_lembrete_horas: 24,
          notificacao_confirmacao_dias: 2,
          campos_obrigatorios_paciente: [],
          configuracoes_whatsapp: {},
          configuracoes_email: {},
        })
        .select()
        .single()

      if (dbError) {
        return error(dbError.message, dbError.code)
      }

      return success(formatConfiguracao(data as ConfiguracaoClinicaDB))
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao criar configurações', 'UNKNOWN_ERROR')
    }
  }

  // Atualizar configurações genérico
  async updateConfigurations(
    clinicaId: string,
    data: Partial<ConfiguracaoClinicaDB>
  ): Promise<ServiceResponse<ConfiguracaoFormatted>> {
    if (!isSupabaseConfigured || !supabase) {
      await simulateDelay()
      return error('Supabase não configurado', 'SUPABASE_NOT_CONFIGURED')
    }

    try {
      const { data: result, error: dbError } = await supabase
        .from('configuracoes_clinica')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('clinica_id', clinicaId)
        .select()
        .single()

      if (dbError) {
        return error(dbError.message, dbError.code)
      }

      return success(formatConfiguracao(result as ConfiguracaoClinicaDB))
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao atualizar configurações', 'UNKNOWN_ERROR')
    }
  }

  // Atualizar configurações padrão
  async updatePadrao(clinicaId: string, data: UpdatePadraoInput): Promise<ServiceResponse<ConfiguracaoFormatted>> {
    // Salvar no campo horario_funcionamento como placeholder (pode ser movido para campo específico)
    return await this.updateConfigurations(clinicaId, {
      horario_funcionamento: { planoContaPadrao: data.planoContaPadrao },
    })
  }

  // Atualizar configurações operacionais
  async updateOperacional(clinicaId: string, data: UpdateOperacionalInput): Promise<ServiceResponse<ConfiguracaoFormatted>> {
    return await this.updateConfigurations(clinicaId, {
      horario_funcionamento: {
        recepcaoFinaliza: data.recepcaoFinaliza,
        marcacaoRetroativa: data.marcacaoRetroativa,
        prontuarioRetroativo: data.prontuarioRetroativo,
        tempoMinimo: data.tempoMinimo,
        incrementar: data.incrementar,
        tempoMaximo: data.tempoMaximo,
      },
    })
  }

  // Atualizar configurações de comunicação
  async updateComunicacao(clinicaId: string, data: UpdateComunicacaoInput): Promise<ServiceResponse<ConfiguracaoFormatted>> {
    return await this.updateConfigurations(clinicaId, {
      configuracoes_whatsapp: {
        enviarSmsMarcar: data.enviarSmsMarcar,
        solicitarConfirmacao: data.solicitarConfirmacao,
      },
    })
  }

  // Atualizar configurações de faturamento
  async updateFaturamento(clinicaId: string, data: UpdateFaturamentoInput): Promise<ServiceResponse<ConfiguracaoFormatted>> {
    return await this.updateConfigurations(clinicaId, {
      configuracoes_email: {
        imposto: data.imposto,
        unificarTitulos: data.unificarTitulos,
        plataforma: data.plataforma,
        notificacao: data.notificacao,
        enviarFatura: data.enviarFatura,
        diaVencimento: data.diaVencimento,
      },
    })
  }

  // Atualizar configurações de aparência (salvas na clínica, não na configuração)
  async updateAparencia(clinicaId: string, data: UpdateAparenciaInput): Promise<ServiceResponse<boolean>> {
    if (!isSupabaseConfigured || !supabase) {
      await simulateDelay()
      return error('Supabase não configurado', 'SUPABASE_NOT_CONFIGURED')
    }

    try {
      const updateData: Record<string, unknown> = {}
      if (data.nomeEmpresa) updateData.nome_fantasia = data.nomeEmpresa
      if (data.logoUrl) updateData.logo_url = data.logoUrl
      // corPrimaria pode ser salva em configuracoes_clinica

      if (Object.keys(updateData).length > 0) {
        const { error: dbError } = await supabase
          .from('clinicas')
          .update(updateData)
          .eq('id', clinicaId)

        if (dbError) {
          return error(dbError.message, dbError.code)
        }
      }

      // Atualizar cor primária nas configurações
      if (data.corPrimaria) {
        await this.updateConfigurations(clinicaId, {
          configuracoes_email: { corPrimaria: data.corPrimaria },
        })
      }

      return success(true)
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao atualizar aparência', 'UNKNOWN_ERROR')
    }
  }

  // Atualizar permissões (placeholder - precisa de tabela específica)
  async updatePermissoes(_clinicaId: string, data: UpdatePermissoesInput): Promise<ServiceResponse<boolean>> {
    if (!isSupabaseConfigured || !supabase) {
      await simulateDelay()
      // Simular sucesso por enquanto
      console.log('Permissões atualizadas (mock):', data)
      return success(true)
    }

    // TODO: Implementar quando tabela de permissões for criada
    console.log('Permissões atualizadas:', data)
    return success(true)
  }

  // Atualizar campos de cadastro rápido
  async updateCadastroRapido(clinicaId: string, data: UpdateCadastroRapidoInput): Promise<ServiceResponse<ConfiguracaoFormatted>> {
    const camposObrigatorios = data.campos
      .filter(c => c.required)
      .map(c => c.id)

    return await this.updateConfigurations(clinicaId, {
      campos_obrigatorios_paciente: camposObrigatorios,
    })
  }
}

// Singleton
export const configurationsService = new ConfigurationsService()
