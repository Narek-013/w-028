import { useEffect, useState } from "react";
import "../../App.css";
import "./Confirm.scss";
import {
  createRsvp,
  fetchRsvpById,
  findRsvpByName,
} from "../../lib/directus";
import { useLanguage } from "../../context/LanguageContext";
import { ARMENIAN_FALLBACKS } from "../../lib/armenianFallbacks";
import { resolveTranslations } from "../../lib/resolveTranslations";

const NAME_PATTERN = "^[A-Za-zԱ-Ֆա-ֆЁёА-Яа-я]{2,}$";
const NAME_REGEX = new RegExp(NAME_PATTERN);
const RSVP_STORAGE_KEY = "invitation_rsvp_id";

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
  const [checking, setChecking] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    lastName: "",
    count: "",
    confirm: "",
    gender: "",
  });

  useEffect(() => {
    let cancelled = false;

    async function verifyExistingRsvp() {
      const storedId = localStorage.getItem(RSVP_STORAGE_KEY);
      if (!storedId) {
        if (!cancelled) setChecking(false);
        return;
      }

      try {
        const existing = await fetchRsvpById(storedId);
        if (cancelled) return;

        if (existing?.id) {
          setUserCome(true);
        } else {
          // CMS has no such RSVP — allow form again
          localStorage.removeItem(RSVP_STORAGE_KEY);
          setUserCome(false);
        }
      } catch {
        // If CMS is unreachable / read blocked, keep confirmed state by stored id
        if (!cancelled) setUserCome(true);
      }

      if (!cancelled) setChecking(false);
    }

    verifyExistingRsvp();
    return () => {
      cancelled = true;
    };
  }, []);

  const markConfirmed = (rsvpId) => {
    if (rsvpId) {
      localStorage.setItem(RSVP_STORAGE_KEY, rsvpId);
    }
    setUserCome(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "count" && value.length > 2) return;

    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      setSendBtn(Boolean(next.name && next.lastName && next.confirm));
      return next;
    });
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

    const name = formData.name.trim();
    const lastName = formData.lastName.trim();

    setSendBtn(false);
    try {
      const existing = await findRsvpByName(name, lastName);
      if (existing?.id) {
        markConfirmed(existing.id);
        return;
      }

      const attending = formData.confirm === "true";
      const payload = {
        name,
        last_name: lastName,
        attending,
        guest_count: attending ? countNumber : null,
      };

      const result = await createRsvp(payload);
      const createdId = result?.data?.id;

      setFormData({
        name: "",
        lastName: "",
        count: "",
        confirm: "",
        gender: "",
      });

      markConfirmed(createdId);
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

          {!checking && !userCome && <h3>{labels.deadline}</h3>}
          {checking ? null : userCome ? (
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
