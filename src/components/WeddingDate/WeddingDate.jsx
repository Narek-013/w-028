import "../../App.css";
import { Imgs } from "../../img/imgs";
import "./WeddingDate.scss";

const WeddingDate = () => {
  return (
    <div className="WeddingDate">
      <div className="WeddingDate_container container">
        {/* <h2>Հարգելի՛ հյուրեր</h2>
        <div className="WeddingDate_container_context">
          <p>
            Մեծ ուրախությամբ հրավիրում ենք Ձեզ մեր հարսանիքին՝ անցկացնելու մեր
            երկար սպասված օրը Ձեզ հետ։
          </p>
          <p>
            Դարձեք մի մասնիկը մեր գեղեցիկ օրվա՝ լցնելով մեր հիշարժան օրն էլ
            առավել գեղեցիկ պահերով։
          </p>
        </div> */}
        <table>
          <tbody>
            <tr>
              <th
                style={{
                  fontSize: "28px",
                  textAlign: "left",
                  letterSpacing: "4px",
                }}
                colSpan={5}
              >
                JANUARY
              </th>
              <th
                style={{
                  fontSize: "28px",
                  textAlign: "right",
                  letterSpacing: "4px",
                }}
                colSpan={2}
              >
                2026
              </th>
            </tr>

            <tr>
              <th style={{ padding: "10px 0" }}>MON</th>
              <th>TUE</th>
              <th>WED</th>
              <th>THU</th>
              <th>FRI</th>
              <th>SAT</th>
              <th>SUN</th>
            </tr>
            <tr>
              <td></td>
              <td></td>
              <td></td>
              <td>1</td>
              <td>2</td>
              <td>3</td>
              <td
                style={{
                  color: "black",
                  textShadow:"0 0 5px white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  zIndex: "0",
                }}
              >
                {<img src={Imgs.heart_icon} alt="animation-icon" />} 4
              </td>
            </tr>
            <tr>
              <td>5</td>
              <td>6</td>
              <td>7</td>
              <td>8</td>
              <td>9</td>
              <td>10</td>
              <td>11</td>
            </tr>
            <tr>
              <td>12</td>
              <td>13</td>
              <td>14</td>
              <td>15</td>
              <td>16</td>
              <td>17</td>
              <td>18</td>
            </tr>
            <tr>
              <td>19</td>
              <td>20</td>
              <td>21</td>
              <td>22</td>
              <td>23</td>
              <td>24</td>
              <td>25</td>
            </tr>
            <tr>
              <td>26</td>
              <td>27</td>
              <td>28</td>
              <td>29</td>
              <td>30</td>
              <td>31</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default WeddingDate;
