import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Leaf, Lock, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/raisin-tech-logo.png";

export default function Login({ onLogin }) {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="login-page">
      <div className="login-visual">
        <div className="login-visual-content">
          <div className="brand login-brand"><div className="login-logo-wrap"><img src={logo} alt="Raisin Tech" /></div></div>
          <div>
            <span className="eyebrow">TECNOLOGIA PARA O AGRONEGÓCIO</span>
            <h1>Decisões melhores começam com dados melhores.</h1>
            <p>Monitore as condições climáticas em um só lugar para encontrar a janela ideal de colheita e exportação.</p>
          </div>
          <div className="login-location">
            <span>Operação</span>
            <strong>Petrolina / Juazeiro</strong>
          </div>
        </div>
      </div>

      <div className="login-form-side">
        <form className="login-card" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
          <div className="mobile-login-brand"><img src={logo} alt="Raisin Tech" /></div>
          <span className="eyebrow">ACESSO AO SISTEMA</span>
          <h2>Bem-vindo de volta</h2>
          <p className="form-intro">Entre com suas credenciais para acessar o painel.</p>

          <label>E-mail</label>
          <div className="input-wrap"><Mail size={18} /><input type="email" placeholder="seu@email.com" defaultValue="admin@raisin-tech.com" required /></div>

          <label>Senha</label>
          <div className="input-wrap">
            <Lock size={18} />
            <input type={show ? "text" : "password"} placeholder="Digite sua senha" defaultValue="123456" required />
            <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Ocultar senha" : "Mostrar senha"}>{show ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
          </div>

          <div className="form-row">
            <label className="checkbox-label"><input type="checkbox"/> Lembrar de mim</label>
            <button type="button" className="text-button" onClick={() => navigate("/recuperar-senha")}>Esqueci minha senha</button>
          </div>

          <button className="primary-button login-button">Entrar <ArrowRight size={18}/></button>
          <small className="demo-note">Protótipo acadêmico • dados demonstrativos</small>
        </form>
      </div>
    </div>
  );
}
