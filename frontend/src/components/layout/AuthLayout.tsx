import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 flex flex-col items-center">
          <img
            src="/assets/ipnl-logo.png?v=1"
            alt="India Property Network Ltd"
            className="h-32 w-auto mb-4"
          />
          <p className="text-muted-foreground">
            India Property Network Ltd.
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
