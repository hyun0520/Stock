import "../styles/Help.css";

export default function Help() {
  const SECTIONS = [
    {
      title: "포트폴리오 분석",
      desc: `자산, 섹터, 산업, 국가별 비중을 한눈에 파악하고
            포트폴리오에 대한 깊은 인사이트를 얻으세요.`,
      img: "/assets/pic4.PNG",
      reverse: false
    },
    {
      title: "관심종목 관리",
      desc: `거래를 입력하거나 가져와 손익 내역을 관리하세요.
            종목별·전체 손익을 명확하게 확인할 수 있습니다.`,
      img: "/assets/pic2.PNG",
      reverse: true
    },
    {
    title: "주가 확인",
    desc: "주가, 그래프를 확인해서 관심종목, 포트폴리오 추가 하고 한눈에 확인해 보세요",
    img: "/assets/pic3.PNG",
    reverse: false
    },
  ];

  return (
    <main className="help-page">
      {/* ================= HERO ================= */}
      <section className="help-hero">
        <div className="text">
          <h1>
            최적의<br />
            <span>포트폴리오 추적기</span>
          </h1>
          <p>
            모든 자산을 하나의 포트폴리오에서 추적하세요.
            <br />
            실시간 가치, 손익, 분석까지 한눈에 확인할 수 있습니다.
          </p>
        </div>

        <div className="image">
          <div className="phone-frame">
            <div className="phone-notch" />
            <img
              src="/assets/pic1.PNG"
              alt="Portfolio overview preview"
              className="phone-screen"
            />
          </div>
        </div>
      </section>

      {/* ================= SECTIONS ================= */}
      {SECTIONS.map((section, index) => (
        <section
          key={index}
          className={`help-section ${
            section.reverse ? "reverse" : ""
          }`}
        >
          <div className="image">
            <div className="phone-frame">
              <div className="phone-notch" />
              <img
                src={section.img}
                alt={section.title}
                className="phone-screen"
              />
            </div>
          </div>

          <div className="text">
            <h2>{section.title}</h2>
            <p>{section.desc}</p>
          </div>
        </section>
      ))}
    </main>
  );
}
