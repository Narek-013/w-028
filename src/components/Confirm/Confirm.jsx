import { useEffect, useRef, useState } from "react";
import "../../App.css";
import "./Confirm.scss";
import {
  findExistingRsvp,
  resolveClientKey,
  upsertRsvp,
} from "../../lib/directus";
import { useLanguage } from "../../context/LanguageContext";
import { ARMENIAN_FALLBACKS } from "../../lib/armenianFallbacks";
import { resolveTranslations } from "../../lib/resolveTranslations";

const NAME_PATTERN = "^[A-Za-zԱ-Ֆա-ֆЁёА-Яа-я]{2,}$";
const NAME_REGEX = new RegExp(NAME_PATTERN);
const RSVP_DONE_KEY = "narek_elen_rsvp_done";

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
  const [checkingIp, setCheckingIp] = useState(true);
  const [clientKey, setClientKey] = useState(null);
  const submittingRef = useRef(false);
  const [formData, setFormData] = useState({
    name: "",
    lastName: "",
    count: "",
    confirm: "",
    gender: "",
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const key = await resolveClientKey();
        if (cancelled) return;

        setClientKey(key);

        // Always trust CMS: if row was deleted in admin, unlock the form again.
        const existing = await findExistingRsvp({ ip: key });
        if (cancelled) return;

        if (existing?.id) {
          localStorage.setItem(RSVP_DONE_KEY, "1");
          setUserCome(true);
        } else {
          localStorage.removeItem(RSVP_DONE_KEY);
          setUserCome(false);
        }
      } catch {
        if (!cancelled) {
          // If CMS check fails, fall back to local flag only for this session.
          setUserCome(localStorage.getItem(RSVP_DONE_KEY) === "1");
        }
      } finally {
        if (!cancelled) setCheckingIp(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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

    if (userCome || submittingRef.current) return;

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
    const attending = formData.confirm === "true";

    submittingRef.current = true;
    setSendBtn(false);

    try {
      const key = clientKey || (await resolveClientKey());
      if (key !== clientKey) setClientKey(key);

      const result = await upsertRsvp({
        name,
        last_name: lastName,
        attending,
        guest_count: attending ? countNumber : null,
        ip: key,
      });

      localStorage.setItem(RSVP_DONE_KEY, "1");

      if (result.action === "created") {
        setFormData({
          name: "",
          lastName: "",
          count: "",
          confirm: "",
          gender: "",
        });
      }

      // Lock after any answer (yes or no) — create/update/exists.
      setUserCome(true);
    } catch (error) {
      alert(`${labels.error_send}: ${error.message}`);
      setSendBtn(true);
      submittingRef.current = false;
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
          {checkingIp ? null : userCome ? (
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
