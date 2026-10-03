import { ArrowLeft, ArrowRight, CheckCircle2, KeyRound, Mail } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/raisin-tech-logo.png";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const submit = (event) => {
    event.preventDefault();
    setSent(true);
  };

  return (
    <div className="forgot-page">
      <div className="forgot-card">
        <div className="forgot-logo"><img src={logo} alt="Raisin Tech" /></div>
        {!sent ? (
          <>
            <div className="auth-icon"><KeyRound size={24}/></div>
            <span className="eyebrow">RECUPERAÇÃO DE ACESSO</span>
            <h1>Esqueci minha senha</h1>
            <p>Informe o e-mail da sua conta. Vamos preparar um link para redefinição da senha.</p>
            <form onSubmit={submit}>
              <label>E-mail cadastrado</label>
              <div className="input-wrap"><Mail size={18}/><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@raisin-tech.com" required /></div>
              <button className="primary-button login-button">Enviar instruções <ArrowRight size={18}/></button>
            </form>
            <button className="back-link" onClick={() => navigate("/")}><ArrowLeft size={16}/> Voltar para o login</button>
          </>
        ) : (
          <div className="success-state">
            <div className="success-circle"><CheckCircle2 size={32}/></div>
            <span className="eyebrow">E-MAIL ENVIADO</span>
            <h1>Confira sua caixa de entrada</h1>
            <p>Enviamos as instruções de recuperação para <strong>{email}</strong>. Em um ambiente real, o link viria do backend.</p>
            <button className="primary-button login-button" onClick={() => navigate("/")}>Voltar para o login</button>
          </div>
        )}
      </div>
    </div>
  );
}
