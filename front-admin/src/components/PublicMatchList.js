import React, { useEffect, useState } from "react";
import {
  List,
  Card,
  Tag,
  Typography,
  Spin,
  Alert,
  Badge,
  Row,
  Col,
  Divider,
} from "antd";
import {
  ClockCircleOutlined,
  FireOutlined,
  CheckCircleOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { getMatches, getTeams } from "../services/api";
import socket from "../services/socket";

const { Text, Title } = Typography;

export default function PublicMatchList() {
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [matchesRes, teamsRes] = await Promise.all([
          getMatches(),
          getTeams(),
        ]);

        setMatches(matchesRes.data);
        setTeams(teamsRes.data);
      } catch (err) {
        setError("Erreur de chargement des données");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const onUpdated = (updatedMatch) => {
      setMatches((prev) =>
        prev.map((m) => (m.id === updatedMatch.id ? updatedMatch : m))
      );
    };

    socket.on("match_updated", onUpdated);
    socket.on("match_created", (newMatch) =>
      setMatches((prev) => [...prev, newMatch])
    );
    socket.on(
      "match:event",
      (payload) => payload?.match && onUpdated(payload.match)
    );

    return () => {
      socket.off("match_updated", onUpdated);
      socket.off("match_created");
      socket.off("match:event");
    };
  }, []);

  const getTeamName = (teamId) => {
    const team = teams.find((t) => t.id === teamId);
    return team ? team.name : "Équipe inconnue";
  };

  const formatDate = (dateString) => {
    const options = {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("fr-FR", options);
  };

  const getStatusTag = (status) => {
    switch (status) {
      case "live":
        return (
          <Tag icon={<FireOutlined />} color="red">
            En direct
          </Tag>
        );
      case "finished":
        return (
          <Tag icon={<CheckCircleOutlined />} color="green">
            Terminé
          </Tag>
        );
      default:
        return (
          <Tag icon={<ClockCircleOutlined />} color="blue">
            À venir
          </Tag>
        );
    }
  };

  if (loading) return <Spin tip="Chargement..." size="large" />;
  if (error) return <Alert message={error} type="error" showIcon />;

  return (
    <div style={{ padding: "24px" }}>
      <Title level={2} style={{ marginBottom: "24px" }}>
        <TeamOutlined /> Matches en direct et à venir
      </Title>

      <List
        grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 3, xxl: 3 }}
        dataSource={matches.sort(
          (a, b) => new Date(a.startAt) - new Date(b.startAt)
        )}
        renderItem={(match) => (
          <List.Item>
            <Badge.Ribbon
              text="LIVE"
              color="red"
              style={{ display: match.status === "live" ? "block" : "none" }}
            >
              <Card
                title={
                  <Row justify="space-between" align="middle">
                    <Col>
                      <Text>{formatDate(match.startAt)}</Text>
                    </Col>
                    <Col>{getStatusTag(match.status)}</Col>
                  </Row>
                }
                hoverable
              >
                <Row justify="center" align="middle" gutter={16}>
                  <Col span={10} style={{ textAlign: "center" }}>
                    <Title level={5}>{getTeamName(match.homeTeamId)}</Title>
                    <Text strong style={{ fontSize: "24px" }}>
                      {match.homeScore}
                    </Text>
                  </Col>

                  <Col span={4} style={{ textAlign: "center" }}>
                    <Divider>vs</Divider>
                  </Col>

                  <Col span={10} style={{ textAlign: "center" }}>
                    <Title level={5}>{getTeamName(match.awayTeamId)}</Title>
                    <Text strong style={{ fontSize: "24px" }}>
                      {match.awayScore}
                    </Text>
                  </Col>
                </Row>
              </Card>
            </Badge.Ribbon>
          </List.Item>
        )}
        locale={{ emptyText: "Aucun match programmé" }}
      />
    </div>
  );
}
