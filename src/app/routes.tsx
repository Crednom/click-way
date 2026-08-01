// Rotas do app (seção 6 do spec). "/" é o RoleGate; "/admin" e "/passageiro"
// são os dois módulos, protegidos por RequireRole — se o papel salvo no store
// não bater com o módulo, o usuário volta para o RoleGate. Isso também cobre
// o caso de recarregar a página direto numa dessas rotas: como o `role` do
// Zustand não é persistido entre recarregamentos (decisão da Fase 2, ver
// PROGRESS.md), o guard manda de volta pra escolha de papel em vez de mostrar
// uma tela quebrada.

import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import type { UserRole } from '../shared/types';
import RoleGate from './RoleGate';
import AdminHome from '../features/admin/AdminHome';
import MapUpload from '../features/admin/MapUpload';
import HomeScreen from '../features/passenger/HomeScreen';

interface RequireRoleProps {
  expected: UserRole;
  children: ReactNode;
}

function RequireRole({ expected, children }: RequireRoleProps) {
  const role = useAppStore((state) => state.role);
  if (role !== expected) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoleGate />} />
        <Route
          path="/admin"
          element={
            <RequireRole expected="admin">
              <AdminHome />
            </RequireRole>
          }
        />
        <Route
          path="/admin/mapa"
          element={
            <RequireRole expected="admin">
              <MapUpload />
            </RequireRole>
          }
        />
        <Route
          path="/passageiro"
          element={
            <RequireRole expected="passenger">
              <HomeScreen />
            </RequireRole>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
