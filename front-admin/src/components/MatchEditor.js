import React, { useState, useEffect } from "react";
import {
  Card,
  InputNumber,
  Button,
  Typography,
  Space,
  Divider,
  Tag,
  message,
  Popconfirm,
  Row,
  Col,
  Select,
  Progress,
  Badge,
  Alert,
  Statistic,
} from "antd";
import {
  SaveOutlined,
  EditOutlined,
  CloseOutlined,
  TrophyOutlined,
  CalendarOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  ClockCircleOutlined,
  FastForwardOutlined,
} from "@ant-design/icons";
import {
  updateScore,
  startMatch,
  finishMatch,
  pauseMatch,
  resumeMatch,
  startSecondHalf,
  setAdditionalTime,
  getMatchEvents,
  addMatchEvent,
  getMatch,
} from "../services/api";
import io from "socket.io-client";

const { Title, Text } = Typography;
const { Countdown } = Statistic;

// Connexion Socket.IO pour le temps réel
// const socket = io("http://192.168.1.75:5000");
const socket = io("http://localhost:5000");

export default function MatchEditor({
  match: initialMatch,
  onClose,
  onUpdate,
}) {
  // État local pour l'objet match
  const [match, setMatch] = useState(initialMatch);
  const [scores, setScores] = useState({
    home: initialMatch.homeScore || 0,
    away: initialMatch.awayScore || 0,
  });
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventType, setEventType] = useState("home_goal");
  const [eventMinute, setEventMinute] = useState("");
  const [eventPlayer, setEventPlayer] = useState("");

  // États pour le chrono
  const [timerState, setTimerState] = useState({
    currentMinute: initialMatch.currentMinute || 0,
    currentSecond: initialMatch.currentSecond || 0,
    isRunning: initialMatch.status === "live",
    additionalTimeFirstHalf: initialMatch.additionalTimeFirstHalf || 0,
    additionalTimeSecondHalf: initialMatch.additionalTimeSecondHalf || 0,
  });

  const [additionalTimeInput, setAdditionalTimeInput] = useState({
    half: 1,
    minutes: 0,
  });

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const res = await getMatchEvents(match.id);
        setEvents(res.data);
      } catch (err) {
        message.error("Erreur lors du chargement des événements");
      }
    };

    loadEvents();

    // Écouter les mises à jour du timer en temps réel
    socket.emit("joinMatch", match.id);

    const handleTimerUpdate = (data) => {
      if (data.matchId === match.id) {
        setTimerState((prev) => ({
          ...prev,
          currentMinute: data.currentMinute,
          currentSecond: data.currentSecond,
          isRunning: data.status === "live",
        }));
      }
    };

    const handleMatchUpdate = (updatedMatch) => {
      if (updatedMatch.id === match.id) {
        setMatch(updatedMatch);
        setScores({
          home: updatedMatch.homeScore || 0,
          away: updatedMatch.awayScore || 0,
        });
      }
    };

    const handleMatchEvent = (payload) => {
      if (payload.match && payload.match.id === match.id) {
        setMatch(payload.match);
        setScores({
          home: payload.match.homeScore || 0,
          away: payload.match.awayScore || 0,
        });
        // Recharger les événements
        loadEvents();
      }
    };

    socket.on("match:timer", handleTimerUpdate);
    socket.on("match_updated", handleMatchUpdate);
    socket.on("match:event", handleMatchEvent);
    socket.on("match:started", () => message.success("Match démarré"));
    socket.on("match:paused", () => message.info("Match mis en pause"));
    socket.on("match:resumed", () => message.success("Match repris"));
    socket.on("match:finished", () => message.success("Match terminé"));
    socket.on("match:second_half_started", () =>
      message.success("Seconde mi-temps démarrée")
    );

    return () => {
      socket.emit("leaveMatch", match.id);
      socket.off("match:timer", handleTimerUpdate);
      socket.off("match_updated", handleMatchUpdate);
      socket.off("match:event", handleMatchEvent);
      socket.off("match:started");
      socket.off("match:paused");
      socket.off("match:resumed");
      socket.off("match:finished");
      socket.off("match:second_half_started");
    };
  }, [match.id]);

  const handleScoreChange = (team, value) => {
    setScores((prev) => ({ ...prev, [team]: value }));
  };

  const saveScore = async () => {
    try {
      setLoading(true);
      const response = await updateScore(match.id, scores.home, scores.away);
      setMatch((prev) => ({
        ...prev,
        homeScore: scores.home,
        awayScore: scores.away,
      }));
      message.success("Score mis à jour");
      if (onUpdate) onUpdate(response.data);
    } catch (err) {
      message.error("Erreur lors de la mise à jour du score");
    } finally {
      setLoading(false);
    }
  };

  const handleStartMatch = async () => {
    try {
      setLoading(true);
      const response = await startMatch(match.id);
      setMatch(response.data);
      setTimerState((prev) => ({ ...prev, isRunning: true }));
      if (onUpdate) onUpdate(response.data);
    } catch (err) {
      message.error("Erreur lors du démarrage du match");
    } finally {
      setLoading(false);
    }
  };

  const handlePauseMatch = async () => {
    try {
      setLoading(true);
      await pauseMatch(match.id);
      setMatch((prev) => ({ ...prev, status: "paused" }));
      setTimerState((prev) => ({ ...prev, isRunning: false }));
    } catch (err) {
      message.error("Erreur lors de la pause du match");
    } finally {
      setLoading(false);
    }
  };

  const handleResumeMatch = async () => {
    try {
      setLoading(true);
      await resumeMatch(match.id);
      setMatch((prev) => ({ ...prev, status: "live" }));
      setTimerState((prev) => ({ ...prev, isRunning: true }));
    } catch (err) {
      message.error("Erreur lors de la reprise du match");
    } finally {
      setLoading(false);
    }
  };

  const handleStartSecondHalf = async () => {
    try {
      setLoading(true);
      await startSecondHalf(match.id);
      setMatch((prev) => ({ ...prev, status: "live" }));
      setTimerState((prev) => ({ ...prev, isRunning: true }));
    } catch (err) {
      message.error("Erreur lors du démarrage de la seconde mi-temps");
    } finally {
      setLoading(false);
    }
  };

  const handleFinishMatch = async () => {
    try {
      setLoading(true);
      const response = await finishMatch(match.id);
      setMatch(response.data);
      setTimerState((prev) => ({ ...prev, isRunning: false }));
      if (onUpdate) onUpdate(response.data);
    } catch (err) {
      message.error("Erreur lors de la fin du match");
    } finally {
      setLoading(false);
    }
  };

  const handleSetAdditionalTime = async () => {
    try {
      setLoading(true);
      await setAdditionalTime(
        match.id,
        additionalTimeInput.half,
        additionalTimeInput.minutes
      );
      const field =
        additionalTimeInput.half === 1
          ? "additionalTimeFirstHalf"
          : "additionalTimeSecondHalf";
      setTimerState((prev) => ({
        ...prev,
        [field]: additionalTimeInput.minutes,
      }));
      message.success(
        `Temps additionnel défini: ${additionalTimeInput.minutes} min`
      );
    } catch (err) {
      message.error("Erreur lors de la définition du temps additionnel");
    } finally {
      setLoading(false);
    }
  };

  const addEvent = async () => {
    if (!eventMinute || isNaN(eventMinute)) {
      message.warning("Veuillez entrer une minute valide");
      return;
    }

    if (!eventPlayer.trim()) {
      message.warning("Veuillez entrer le nom du joueur");
      return;
    }

    try {
      setLoading(true);
      const eventData = {
        type: eventType,
        teamId: eventType.includes("home")
          ? match.homeTeam.id
          : match.awayTeam.id,
        player: eventPlayer,
        minute: parseInt(eventMinute),
      };

      await addMatchEvent(match.id, eventData);
      message.success("Événement ajouté");
      setEventMinute("");
      setEventPlayer("");

      // Recharger les événements et le match
      const [eventsRes, matchRes] = await Promise.all([
        getMatchEvents(match.id),
        getMatch(match.id),
      ]);

      setEvents(eventsRes.data);
      setScores({
        home: matchRes.data.homeScore || 0,
        away: matchRes.data.awayScore || 0,
      });
    } catch (err) {
      message.error("Erreur lors de l'ajout de l'événement");
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = () => {
    switch (match.status) {
      case "scheduled":
        return <Tag color="blue">À venir</Tag>;
      case "live":
        return (
          <Badge status="processing">
            <Tag color="red">En cours</Tag>
          </Badge>
        );
      case "paused":
        return <Tag color="orange">En pause</Tag>;
      case "finished":
        return <Tag color="green">Terminé</Tag>;
      default:
        return <Tag>{match.status}</Tag>;
    }
  };

  const formatTime = () => {
    const { currentMinute, currentSecond } = timerState;
    const minutes = String(currentMinute).padStart(2, "0");
    const seconds = String(currentSecond).padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const getMatchPeriod = () => {
    const { currentMinute } = timerState;
    if (currentMinute < 45) return "1ère mi-temps";
    if (currentMinute === 45) return "Temps additionnel 1ère MT";
    if (currentMinute < 90) return "2ème mi-temps";
    return "Temps additionnel 2ème MT";
  };

  const getProgressPercent = () => {
    const { currentMinute } = timerState;
    return Math.min((currentMinute / 90) * 100, 100);
  };

  return (
    <Card
      title={
        <Space>
          <TrophyOutlined />
          <Title level={4} style={{ margin: 0 }}>
            Contrôle du match
          </Title>
          {getStatusTag()}
        </Space>
      }
      extra={onClose && <Button icon={<CloseOutlined />} onClick={onClose} />}
      style={{ width: "100%", maxWidth: 1000 }}
    >
      {/* Chrono et contrôles en temps réel */}
      {match.status !== "scheduled" && (
        <Alert
          message={
            <Row align="middle" justify="space-between">
              <Col>
                <Space>
                  <ClockCircleOutlined />
                  <Text strong style={{ fontSize: 18 }}>
                    {formatTime()}
                  </Text>
                  <Text type="secondary">({getMatchPeriod()})</Text>
                </Space>
              </Col>
              <Col>
                <Progress
                  percent={getProgressPercent()}
                  showInfo={false}
                  strokeColor="#52c41a"
                  trailColor="#f0f0f0"
                  strokeWidth={8}
                  style={{ width: 200 }}
                />
              </Col>
            </Row>
          }
          type={timerState.isRunning ? "success" : "warning"}
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={24}>
        {/* Colonne principale - Match */}
        <Col span={12}>
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <div>
              <Title level={5}>
                <CalendarOutlined /> {new Date(match.startAt).toLocaleString()}
              </Title>
            </div>

            <Row gutter={16} align="middle" justify="center">
              <Col span={10} style={{ textAlign: "center" }}>
                <Title level={4}>
                  {match.homeTeam?.name || "Équipe domicile"}
                </Title>
                <InputNumber
                  min={0}
                  value={scores.home}
                  onChange={(value) => handleScoreChange("home", value)}
                  disabled={match.status !== "live"}
                  size="large"
                  style={{ fontSize: 24, width: 80 }}
                />
              </Col>

              <Col span={4} style={{ textAlign: "center" }}>
                <Divider>VS</Divider>
              </Col>

              <Col span={10} style={{ textAlign: "center" }}>
                <Title level={4}>
                  {match.awayTeam?.name || "Équipe extérieure"}
                </Title>
                <InputNumber
                  min={0}
                  value={scores.away}
                  onChange={(value) => handleScoreChange("away", value)}
                  disabled={match.status !== "live"}
                  size="large"
                  style={{ fontSize: 24, width: 80 }}
                />
              </Col>
            </Row>

            {/* Contrôles de match */}
            <Space wrap>
              {match.status === "scheduled" && (
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={handleStartMatch}
                  loading={loading}
                  size="large"
                >
                  Démarrer le match
                </Button>
              )}

              {match.status === "live" && (
                <>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={saveScore}
                    loading={loading}
                  >
                    Corriger le score
                  </Button>

                  <Button
                    icon={<PauseCircleOutlined />}
                    onClick={handlePauseMatch}
                    loading={loading}
                  >
                    Pause
                  </Button>

                  {timerState.currentMinute >= 45 &&
                    timerState.currentMinute < 50 && (
                      <Button
                        icon={<FastForwardOutlined />}
                        onClick={handleStartSecondHalf}
                        loading={loading}
                        type="dashed"
                      >
                        2ème mi-temps
                      </Button>
                    )}

                  <Popconfirm
                    title="Terminer le match?"
                    onConfirm={handleFinishMatch}
                    okText="Oui"
                    cancelText="Non"
                  >
                    <Button danger icon={<StopOutlined />}>
                      Terminer
                    </Button>
                  </Popconfirm>
                </>
              )}

              {match.status === "paused" && (
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={handleResumeMatch}
                  loading={loading}
                >
                  Reprendre
                </Button>
              )}
            </Space>
          </Space>
        </Col>

        {/* Colonne droite - Événements */}
        <Col span={12}>
          <Row gutter={16}>
            <Col span={12}>
              <Title level={5}>Événements du match</Title>

              {match.status === "live" && (
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Row gutter={8}>
                    <Col span={24}>
                      <Select
                        value={eventType}
                        onChange={setEventType}
                        style={{ width: "100%" }}
                      >
                        <Select.Option value="home_goal">
                          ⚽ But domicile
                        </Select.Option>
                        <Select.Option value="away_goal">
                          ⚽ But extérieur
                        </Select.Option>
                        <Select.Option value="yellow_card">
                          🟨 Carton jaune
                        </Select.Option>
                        <Select.Option value="red_card">
                          🟥 Carton rouge
                        </Select.Option>
                        <Select.Option value="substitution">
                          🔄 Remplacement
                        </Select.Option>
                      </Select>
                    </Col>
                  </Row>

                  <Row gutter={8}>
                    <Col span={12}>
                      <InputNumber
                        placeholder="Minute"
                        value={eventMinute}
                        onChange={setEventMinute}
                        min={0}
                        max={120}
                        style={{ width: "100%" }}
                      />
                    </Col>
                    <Col span={12}>
                      <Button
                        onClick={addEvent}
                        loading={loading}
                        icon={<EditOutlined />}
                        type="primary"
                        style={{ width: "100%" }}
                      >
                        Ajouter
                      </Button>
                    </Col>
                  </Row>

                  <input
                    type="text"
                    placeholder="Nom du joueur"
                    value={eventPlayer}
                    onChange={(e) => setEventPlayer(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "6px 11px",
                      border: "1px solid #d9d9d9",
                      borderRadius: "6px",
                    }}
                  />
                </Space>
              )}

              <div style={{ maxHeight: 250, overflowY: "auto", marginTop: 16 }}>
                {events.length > 0 ? (
                  events
                    .sort((a, b) => b.minute - a.minute) // Trier par minute décroissante
                    .map((event, index) => (
                      <div
                        key={index}
                        style={{
                          marginBottom: 8,
                          padding: 8,
                          backgroundColor: "#f8f9fa",
                          borderRadius: 4,
                        }}
                      >
                        <Text strong>{event.minute}'</Text>
                        <Text style={{ marginLeft: 8 }}>
                          {event.type === "home_goal" ||
                          event.type === "away_goal"
                            ? "⚽"
                            : event.type === "yellow_card"
                            ? "🟨"
                            : event.type === "red_card"
                            ? "🟥"
                            : event.type === "substitution"
                            ? "🔄"
                            : "📝"}{" "}
                          {event.player}
                        </Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {event.type.replace("_", " ")}
                        </Text>
                      </div>
                    ))
                ) : (
                  <Text type="secondary">Aucun événement</Text>
                )}
              </div>
            </Col>

            {/* Temps additionnel */}
            <Col span={12}>
              <Title level={5}>Temps additionnel</Title>

              {match.status === "live" && (
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Select
                    value={additionalTimeInput.half}
                    onChange={(value) =>
                      setAdditionalTimeInput((prev) => ({
                        ...prev,
                        half: value,
                      }))
                    }
                    style={{ width: "100%" }}
                  >
                    <Select.Option value={1}>1ère mi-temps</Select.Option>
                    <Select.Option value={2}>2ème mi-temps</Select.Option>
                  </Select>

                  <InputNumber
                    placeholder="Minutes"
                    value={additionalTimeInput.minutes}
                    onChange={(value) =>
                      setAdditionalTimeInput((prev) => ({
                        ...prev,
                        minutes: value,
                      }))
                    }
                    min={0}
                    max={15}
                    style={{ width: "100%" }}
                  />

                  <Button
                    onClick={handleSetAdditionalTime}
                    loading={loading}
                    style={{ width: "100%" }}
                  >
                    Définir
                  </Button>
                </Space>
              )}

              <div style={{ marginTop: 16 }}>
                <Text>1ère MT: +{timerState.additionalTimeFirstHalf}min</Text>
                <br />
                <Text>2ème MT: +{timerState.additionalTimeSecondHalf}min</Text>
              </div>
            </Col>
          </Row>
        </Col>
      </Row>
    </Card>
  );
}
