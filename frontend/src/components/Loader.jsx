import "./Loader.css";

const Loader = () => {
  return (
    <div className="glass-loader">

      <div className="engine">
        <div className="d-core">
          <img src="/delivos.png" alt="Delivo" />
        </div>

        <div className="scan"></div>

        <div className="orbit o1"></div>
        <div className="orbit o2"></div>
        <div className="orbit o3"></div>

        <div className="particle p1"></div>
        <div className="particle p2"></div>
        <div className="particle p3"></div>
        <div className="particle p4"></div>
      </div>

      <div className="reveal">DELIVO</div>
      <div className="subtitle">initializing delivery network...</div>

      <div className="noise"></div>
    </div>
  );
};

export default Loader;