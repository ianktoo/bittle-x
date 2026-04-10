import React from 'react';
import { Home, AlertTriangle } from 'lucide-react';

interface ErrorPageProps {
  code: number;
  title: string;
  message: string;
}

const ErrorPage: React.FC<ErrorPageProps> = ({ code, title, message }) => {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{code} - {title}</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html { font-family: Nunito, sans-serif; }
          body {
            background-color: #000000;
            background-image: radial-gradient(circle at 50% 0%, rgba(250, 204, 21, 0.15) 0%, transparent 40%);
            color: #f1f5f9;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container {
            text-align: center;
            max-width: 500px;
          }
          .error-code {
            font-size: 120px;
            font-weight: 800;
            color: #FACC15;
            line-height: 1;
            margin-bottom: 20px;
          }
          h1 {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 12px;
          }
          p {
            font-size: 18px;
            color: #cbd5e1;
            margin-bottom: 32px;
          }
          a {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: #FACC15;
            color: #000000;
            padding: 12px 28px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
            font-size: 16px;
          }
          a:hover {
            background: #f1c232;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(250, 204, 21, 0.3);
          }
          .icon {
            display: inline-block;
            margin-right: 8px;
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="error-code">{code}</div>
          <h1>{title}</h1>
          <p>{message}</p>
          <a href="/">
            <span className="icon">🏠</span>
            Back to Home
          </a>
        </div>
      </body>
    </html>
  );
};

export default ErrorPage;
