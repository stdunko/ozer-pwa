import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import PrimaryButton from "../components/PrimaryButton";

const GreetingScreen = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="screen screen-surface">
      <AppHeader
        title="Ozeril"
        avatar={<img src="/logo.png" alt="" className="header-brand-logo" />}
      />
      <div className="pad-lg greeting-body">
        <div className="center-col">
          <img src="/logo.png" alt="Ozeril" className="logo" />
          <p className="tagline">{t("logInFooterText")}</p>
        </div>
        <PrimaryButton title={t("logInButtonText")} onPress={() => navigate("/login/phone")} />
      </div>
    </div>
  );
};

export default GreetingScreen;
