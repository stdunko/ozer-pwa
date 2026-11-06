import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { authLogin, authRegister } from "../services/api";
import { useNotifier } from "../components/AppNotifier";
import { useRtl } from "../hooks/useRtl";
import AppHeader from "../components/AppHeader";

const EnterNumberScreen = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showApiError } = useNotifier();
  const { isRtl } = useRtl();
  const [phone, setPhone] = useState("+972");
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    setIsLoading(true);
    const { error } = await authLogin(phone);
    if (error) {
      const { error: regError } = await authRegister(phone);
      if (regError) {
        showApiError(regError, "errorAuth");
        setIsLoading(false);
        return;
      }
    }
    navigate("/login/otp", { state: { phone } });
    setIsLoading(false);
  };

  return (
    <div className="screen">
      <AppHeader title={t("logInNumberText")} back />
      <div className="pad grow">
        <p className="hint">{t("logInNumberUnderText")}</p>
        <div className="phone-row">
          <div className="phone-input">
            <span className="phone-flag">🇮🇱</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, ""))}
              placeholder={t("logInNumberText")}
              dir="ltr"
            />
          </div>
          <button
            type="button"
            className="entry-btn"
            disabled={phone.length < 5 || isLoading}
            onClick={handleContinue}
          >
            {isLoading ? (
              <span className="spinner" style={{ borderTopColor: "#fff", width: 18, height: 18 }} />
            ) : (
              <ArrowRight size={22} style={{ transform: isRtl ? "scaleX(-1)" : undefined }} />
            )}
          </button>
        </div>
        <p className="hint">{t("logInNumberFooterText")}</p>
      </div>
    </div>
  );
};

export default EnterNumberScreen;
