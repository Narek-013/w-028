import { useEffect, useState } from "react";
import "../../App.css";
import AdsFooter from "../AdsFooter/AdsFooter";
import "./Confirm.scss";
import { createRsvp } from "../../lib/directus";

const Confirm = () => {
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

    const nameRegex = /^[A-Za-zԱ-Ֆա-ֆ]{2,}$/;

    if (!nameRegex.test(formData.name.trim()) || !nameRegex.test(formData.lastName.trim())) {
      alert("The name and the surname must include only letters and consist of one word");
      return;
    }

    const countNumber = parseInt(formData.count);
    if (inp) {
      if (isNaN(countNumber) || countNumber < 1 || countNumber > 99) {
        alert("Fill in the right number of guests: 1-99։");
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
      alert(`Failed to send RSVP: ${error.message}`);
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
        <h2>R S V P</h2>
        <div className="confirm-context">
          <p>Your participation is very important to us, so please fill out this form with your response.</p>

          {!userCome && <h3>We will be waiting for your reply until 01.01.2026 </h3>}
          {userCome ? (
            <h3>You have already confirmed your participation</h3>
          ) : (
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                pattern="^[A-Za-zԱ-Ֆա-ֆ]{2,}$"
                title="Only letters, without spaces"
              />
              <input
                type="text"
                placeholder="surname"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                pattern="^[A-Za-zԱ-Ֆա-ֆ]{2,}$"
                title="Only letters, without spaces"
              />

              <p>Please indicate your attendance availability</p>
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
                - I will gladly attend
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
                - Unfortunately, I won’t be able to attend
              </label>

              {inp && (
                <input
                  type="number"
                  name="count"
                  placeholder="number of guests"
                  value={formData.count}
                  onChange={handleChange}
                  required
                  min="1"
                  max="99"
                  inputMode="numeric"
                />
              )}
              <button type="submit" className={`${!sendBtn && "disabled"}`}>
                Send
              </button>
            </form>
          )}
        </div>
        <AdsFooter />
      </div>
    </div>
  );
};

export default Confirm;
