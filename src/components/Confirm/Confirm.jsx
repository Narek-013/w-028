import { useEffect, useState } from "react";
import "../../App.css";
import "./Confirm.scss";
import { createRsvp } from "../../lib/directus";
import { useLanguage } from "../../context/LanguageContext";
import { ARMENIAN_FALLBACKS } from "../../lib/armenianFallbacks";
import { resolveTranslations } from "../../lib/resolveTranslations";

const NAME_PATTERN = "^[A-Za-zԱ-Ֆա-ֆЁёА-Яа-я]{2,}$";
const NAME_REGEX = new RegExp(NAME_PATTERN);

const Confirm = () => {
  const { languageCode, confirmTranslations } = useLanguage();
  const labels = resolveTranslations(
    languageCode,
    confirmTranslations,
    ARMENIAN_FALLBACKS.confirm,
  );

  const [inp, setInp] = useState(false);
  const [sendBtn, setSendBtn] = useState(false);
  const [userCome, setUserCome] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    lastName: "",
    count: "",
    confirm: "",
    gender: "",
  });

  useEffect(() => {
    const getData = localStorage.getItem("invitation_user");
    if (getData) {
      setUserCome(false);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type } = e.target;

    if (name === "count" && value.length > 2) return;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "radio" ? value : value,
    }));
    if (formData.name && formData.lastName && formData.confirm) {
      setSendBtn(true);
    } else {
      setSendBtn(false);
    }
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();

    if (!NAME_REGEX.test(formData.name.trim()) || !NAME_REGEX.test(formData.lastName.trim())) {
      alert(labels.error_name);
      return;
    }

    const countNumber = parseInt(formData.count);
    if (inp) {
      if (isNaN(countNumber) || countNumber < 1 || countNumber > 99) {
        alert(labels.error_count);
        return;
      }
    }
    const attending = formData.confirm === "true";
    const payload = {
      name: formData.name.trim(),
      last_name: formData.lastName.trim(),
      attending,
      guest_count: attending ? countNumber : null,
    };

    setSendBtn(false);
    try {
      await createRsvp(payload);

      setFormData({
        name: "",
        lastName: "",
        count: "",
        confirm: "",
        gender: "",
      });

      localStorage.setItem("invitation_user", JSON.stringify(true));
      setUserCome(true);
    } catch (error) {
      alert(`${labels.error_send}: ${error.message}`);
      setSendBtn(true);
    }
  };

  const handleInp = (ev) => {
    if (ev.target.value === "true") {
      setInp(true);
    } else {
      setInp(false);
    }
  };

  return (
    <div className="Confirm">
      <div className="Confirm_container container">
        <h2>{labels.title}</h2>
        <div className="confirm-context">
          <p>{labels.intro}</p>

          {!userCome && <h3>{labels.deadline}</h3>}
          {userCome ? (
            <h3>{labels.already_confirmed}</h3>
          ) : (
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder={labels.placeholder_name}
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                pattern={NAME_PATTERN}
                title={labels.name_hint}
              />
              <input
                type="text"
                placeholder={labels.placeholder_surname}
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                pattern={NAME_PATTERN}
                title={labels.name_hint}
              />

              <p>{labels.attendance_question}</p>
              <label htmlFor="confirm_true">
                <input
                  type="radio"
                  id="confirm_true"
                  name="confirm"
                  value="true"
                  checked={formData.confirm === "true"}
                  onChange={(ev) => {
                    handleChange(ev);
                    handleInp(ev);
                  }}
                />
                {` - ${labels.attend_yes}`}
              </label>

              <label htmlFor="confirm_false">
                <input
                  type="radio"
                  id="confirm_false"
                  name="confirm"
                  value="false"
                  checked={formData.confirm === "false"}
                  onChange={(ev) => {
                    handleChange(ev);
                    handleInp(ev);
                  }}
                />
                {` - ${labels.attend_no}`}
              </label>

              {inp && (
                <input
                  type="number"
                  name="count"
                  placeholder={labels.placeholder_guests}
                  value={formData.count}
                  onChange={handleChange}
                  required
                  min="1"
                  max="99"
                  inputMode="numeric"
                />
              )}
              <button type="submit" className={`${!sendBtn && "disabled"}`}>
                {labels.submit}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Confirm;
