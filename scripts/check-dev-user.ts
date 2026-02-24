/**
 * Script para verificar usuário desenvolvedor
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function check() {
  console.log('🔍 Verificando usuário desenvolvedor...\n')

  // Verificar em auth.users
  const { data: users } = await supabase.auth.admin.listUsers()
  const authUser = users?.users.find((u) => u.email === 'gestao@doed.com.br')

  if (authUser) {
    console.log('✅ auth.users:')
    console.log('   ID:', authUser.id)
    console.log('   Email:', authUser.email)
    console.log('   Metadata:', JSON.stringify(authUser.user_metadata))
  } else {
    console.log('❌ Usuário NÃO encontrado em auth.users')
  }

  console.log('')

  // Verificar em public.usuarios
  const { data: usuario, error } = await supabase
    .from('usuarios')
    .select('id, email, nome_completo, perfil_tipo, ativo')
    .eq('email', 'gestao@doed.com.br')
    .single()

  if (usuario) {
    console.log('✅ public.usuarios:')
    console.log('   ID:', usuario.id)
    console.log('   Email:', usuario.email)
    console.log('   Nome:', usuario.nome_completo)
    console.log('   Perfil:', usuario.perfil_tipo)
    console.log('   Ativo:', usuario.ativo)
  } else {
    console.log('❌ Usuário NÃO encontrado em public.usuarios')
    if (error) console.log('   Erro:', error.message)
  }
}

check()
