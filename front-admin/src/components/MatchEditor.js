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
} from "antd";
import {
  SaveOutlined,
  EditOutlined,
  CloseOutlined,
  TrophyOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import {
  updateScore,
  startMatch,
  finishMatch,
  getMatchEvents,
  addMatchEvent,
  getMatch,
} from "../services/api";

const { Title, Text } = Typography;

export default function MatchEditor({
  match: initialMatch,
  onClose,
  onUpdate,
}) {
  // État local pour l'objet match
  const [match, setMatch] = useState(initialMatch);
  const [scores, setScores] = useState({
    home: initialMatch.homeScore,
    away: initialMatch.awayScore,
  });
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventType, setEventType] = useState("goal");
  const [eventMinute, setEventMinute] = useState("");

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
  }, [match.id]);

  const handleScoreChange = (team, value) => {
    setScores((prev) => ({ ...prev, [team]: value }));
  };

  const saveScore = async () => {
    try {
      setLoading(true);
      const response = await updateScore(match.id, scores.home, scores.away);

      // Mettre à jour l'objet match local
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

      // Mettre à jour l'objet match local avec la réponse du serveur
      setMatch(response.data);

      message.success("Match commencé");
      console.log("Match mis à jour:", response.data);

      if (onUpdate) onUpdate(response.data);
    } catch (err) {
      message.error("Erreur lors du démarrage du match");
    } finally {
      setLoading(false);
    }
  };

  const handleFinishMatch = async () => {
    try {
      setLoading(true);
      const response = await finishMatch(match.id);

      // Mettre à jour l'objet match local
      setMatch(response.data);

      message.success("Match terminé");
      if (onUpdate) onUpdate(response.data);
    } catch (err) {
      message.error("Erreur lors de la fin du match");
    } finally {
      setLoading(false);
    }
  };

  const addEvent = async () => {
    if (!eventMinute || isNaN(eventMinute)) {
      message.warning("Veuillez entrer une minute valide");
      return;
    }

    try {
      setLoading(true);
      const eventData = {
        type: eventType,
        teamId: eventType.includes("home")
          ? match.homeTeam.id
          : match.awayTeam.id,
        player: "Joueur",
        minute: parseInt(eventMinute),
      };

      await addMatchEvent(match.id, eventData);
      message.success("Événement ajouté");
      setEventMinute("");

      // Recharger les événements
      const res = await getMatchEvents(match.id);
      setEvents(res.data);

      const response = await getMatch(match.id);

      setScores({
        home: response.data.homeScore,
        away: response.data.awayScore,
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
        return <Tag color="red">En cours</Tag>;
      case "finished":
        return <Tag color="green">Terminé</Tag>;
      default:
        return <Tag>{match.status}</Tag>;
    }
  };

  return (
    <Card
      title={
        <Space>
          <TrophyOutlined />
          <Title level={4} style={{ margin: 0 }}>
            Éditer le match
          </Title>
          {getStatusTag()}
        </Space>
      }
      extra={onClose && <Button icon={<CloseOutlined />} onClick={onClose} />}
      style={{ width: "100%", maxWidth: 800 }}
    >
      <Row gutter={16}>
        <Col span={16}>
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <div>
              <Title level={5}>
                <CalendarOutlined /> {new Date(match.startAt).toLocaleString()}
              </Title>
            </div>

            <Row gutter={16} align="middle" justify="center">
              <Col span={10} style={{ textAlign: "center" }}>
                <Title level={4}>{match.homeTeam.name}</Title>
                <InputNumber
                  min={0}
                  value={scores.home}
                  onChange={(value) => handleScoreChange("home", value)}
                  disabled={match.status !== "live"}
                  size="large"
                />
              </Col>

              <Col span={4} style={{ textAlign: "center" }}>
                <Divider>VS</Divider>
              </Col>

              <Col span={10} style={{ textAlign: "center" }}>
                <Title level={4}>{match.awayTeam.name}</Title>
                <InputNumber
                  min={0}
                  value={scores.away}
                  onChange={(value) => handleScoreChange("away", value)}
                  disabled={match.status !== "live"}
                  size="large"
                />
              </Col>
            </Row>

            {match.status === "live" && (
              <Space>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={saveScore}
                  loading={loading}
                >
                  Corriger le score
                </Button>

                <Popconfirm
                  title="Terminer le match?"
                  onConfirm={handleFinishMatch}
                  okText="Oui"
                  cancelText="Non"
                >
                  <Button danger>Terminer le match</Button>
                </Popconfirm>
              </Space>
            )}

            {match.status === "scheduled" && (
              <Button
                type="primary"
                onClick={handleStartMatch}
                loading={loading}
              >
                Commencer le match
              </Button>
            )}
          </Space>
        </Col>

        <Col span={8}>
          <Title level={5}>Événements du match</Title>

          {match.status === "live" && (
            <Space style={{ marginBottom: 16, width: "100%" }}>
              <Select
                value={eventType}
                onChange={setEventType}
                style={{ width: 120 }}
              >
                {/* <Select.Option value="goal">But</Select.Option> */}
                <Select.Option value="home_goal">But domicile</Select.Option>
                <Select.Option value="away_goal">But extérieur</Select.Option>
                <Select.Option value="yellow_card">Carton jaune</Select.Option>
                <Select.Option value="red_card">Carton rouge</Select.Option>
              </Select>

              <InputNumber
                placeholder="Minute"
                value={eventMinute}
                onChange={setEventMinute}
                min={1}
                max={120}
              />

              <Button
                onClick={addEvent}
                loading={loading}
                icon={<EditOutlined />}
              />
            </Space>
          )}

          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            {events.length > 0 ? (
              events.map((event, index) => (
                <div key={index} style={{ marginBottom: 8 }}>
                  <Text>
                    {event.minute}' -{" "}
                    {event.type === "goal"
                      ? "⚽"
                      : event.type.includes("card")
                      ? "🟨"
                      : ""}{" "}
                    {event.player}
                  </Text>
                </div>
              ))
            ) : (
              <Text type="secondary">Aucun événement</Text>
            )}
          </div>
        </Col>
      </Row>
    </Card>
  );
}
