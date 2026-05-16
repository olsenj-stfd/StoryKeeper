'use client';

import { idbAdapter } from './idb';
import { supabaseAdapter } from './supabase';

export const data = supabaseAdapter ?? idbAdapter;
