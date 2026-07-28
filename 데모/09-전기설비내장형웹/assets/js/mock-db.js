(() => {
  "use strict";
  const PRODUCTION_ADAPTER_CONTRACT = "운영 단계에서 동일 반환 형식의 PHP/MariaDB 어댑터로 교체";
  const metrics = [
    { key: "voltage", label: "선간 전압", value: "22,900", unit: "V", status: "정상", tone: "normal" },
    { key: "current", label: "전체 전류", value: "1,248", unit: "A", status: "정상", tone: "normal" },
    { key: "frequency", label: "주파수", value: "60.0", unit: "Hz", status: "정상", tone: "normal" },
    { key: "activePower", label: "유효 전력", value: "1,154", unit: "kW", status: "정상", tone: "normal" },
    { key: "powerFactor", label: "역률", value: "0.96", unit: "PF", status: "양호", tone: "normal" },
    { key: "todayEnergy", label: "금일 전력량", value: "18.42", unit: "MWh", status: "예측 22.8", tone: "offline" }
  ];
  const load24h = [
    ["00:00", 642, 720], ["02:00", 580, 690], ["04:00", 512, 650], ["06:00", 688, 720],
    ["08:00", 984, 880], ["10:00", 1182, 1040], ["12:00", 1286, 1100], ["14:00", 1214, 1080],
    ["16:00", 1032, 980], ["18:00", 1096, 1020], ["20:00", 1248, 1120], ["22:00", 1154, 1080]
  ];
  const load7d = [
    ["07/08", 1038, 1050], ["07/09", 1142, 1080], ["07/10", 1088, 1060], ["07/11", 1264, 1120],
    ["07/12", 1198, 1100], ["07/13", 1014, 1040], ["07/14", 1154, 1080]
  ];
  const equipment = [
    { name: "MAIN ACB", running: "운전", load: "68%", temperature: "42.8°C", status: "정상", tone: "normal" },
    { name: "TR #1", running: "운전", load: "72%", temperature: "58.4°C", status: "정상", tone: "normal" },
    { name: "TR #2", running: "대기", load: "12%", temperature: "31.2°C", status: "정상", tone: "normal" },
    { name: "CAP BANK #1", running: "운전", load: "38%", temperature: "71.2°C", status: "주의", tone: "warning" }
  ];
  const phases = [
    { label: "R", percent: 68, current: "1,241 A", color: "var(--color-signal-600)" },
    { label: "S", percent: 64, current: "1,176 A", color: "var(--color-data-cyan)" },
    { label: "T", percent: 70, current: "1,284 A", color: "var(--color-success)" }
  ];
  window.VoltGuardData = Object.freeze({
    adapterContract: PRODUCTION_ADAPTER_CONTRACT,
    queryMetrics: () => metrics.map((item) => ({ ...item })),
    queryLoadSeries: (range) => (range === "7d" ? load7d : load24h).map(([label, actual, target]) => ({ label, actual, target })),
    queryEquipment: () => equipment.map((item) => ({ ...item })),
    queryPhases: () => phases.map((item) => ({ ...item }))
  });
})();
