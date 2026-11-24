// PENDIENTE (servicio externo): integración con Supabase Auth.
// El proyecto hoy usa autenticación propia (JWT firmado por el backend +
// contraseñas cifradas con scrypt), por lo que este archivo no se utiliza.
// Para activarlo más adelante: crear el proyecto en Supabase, definir
// VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY y volver a conectar el contexto
// de autenticación con este cliente.
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});
