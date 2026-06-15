import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">IPN</h1>
          <p className="text-muted-foreground">
            India Property Networks
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
