"use client";

import { store } from '../store/store';
import axios from 'axios';

export const appAxios = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'x-locale': store._get('locale'),
  },
});
