import React, { useEffect, useState } from "react";
import {
  List,
  Card,
  Button,
  Typography,
  Spin,
  Space,
  Divider,
  message,
  Modal,
} from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { getMatches, deleteMatch } from "../services/api";
import socket from "../services/socket";
import MatchForm from "./MatchForm";
import MatchEditor from "./MatchEditor";

const { Title, Text } = Typography;
const { confirm } = Modal;

export default function MatchList() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);

  useEffect(() => {
    loadMatches();

    const handleMatchUpdated = (updatedMatch) => {
      setMatches((prev) =>
        prev.map((m) => (m.id === updatedMatch.id ? updatedMatch : m))
      );
      if (selectedMatch?.id === updatedMatch.id) {
        setSelectedMatch(updatedMatch);
      }
    };

    socket.on("match_updated", handleMatchUpdated);
    socket.on("match_created", (newMatch) => {
      setMatches((prev) => [...prev, newMatch]);
      message.success("Nouveau match créé avec succès");
    });

    return () => {
      socket.off("match_updated", handleMatchUpdated);
      socket.off("match_created");
    };
  }, [selectedMatch]);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const res = await getMatches();
      setMatches(res.data);
    } catch (error) {
      message.error("Erreur lors du chargement des matches");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (matchId) => {
    confirm({
      title: "Confirmer la suppression",
      icon: <ExclamationCircleOutlined />,
      content: "Êtes-vous sûr de vouloir supprimer ce match ?",
      okText: "Supprimer",
      okType: "danger",
      cancelText: "Annuler",
      onOk: async () => {
        try {
          await deleteMatch(matchId);
          setMatches((prev) => prev.filter((m) => m.id !== matchId));
          message.success("Match supprimé avec succès");
        } catch (error) {
          message.error("Erreur lors de la suppression");
        }
      },
    });
  };

  const showMatchDetails = (match) => {
    setSelectedMatch(match);
  };

  const closeMatchDetails = () => {
    setSelectedMatch(null);
  };

  return (
    <div style={{ padding: "24px" }}>
      <Space style={{ marginBottom: 24 }} align="center">
        <Title level={3} style={{ margin: 0 }}>
          Liste des matches
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setFormVisible(true)}
        >
          Ajouter un match
        </Button>
        <Button
          icon={<ReloadOutlined />}
          onClick={loadMatches}
          loading={loading}
        />
      </Space>

      {formVisible ? (
        <MatchForm
          onMatchAdded={() => {
            setFormVisible(false);
          }}
          onCancel={() => setFormVisible(false)}
          onSuccess={() => {
            setFormVisible(false);
            loadMatches();
          }}
        />
      ) : null}

      <List
        loading={loading}
        dataSource={matches}
        renderItem={(match) => (
          <List.Item>
            <Card
              title={`${match.homeTeam.name} # ${match.awayTeam.name}`}
              style={{ width: "100%" }}
              actions={[
                <Button type="link" onClick={() => showMatchDetails(match)}>
                  Éditer
                </Button>,
                <Button
                  type="link"
                  danger
                  onClick={() => handleDelete(match.id)}
                >
                  Supprimer
                </Button>,
              ]}
            >
              <Space direction="vertical" style={{ width: "100%" }}>
                <Text strong>Statut: </Text>
                <Text>{match.status}</Text>

                <Divider style={{ margin: "12px 0" }} />

                <Text strong>Scores: </Text>
                <Text>
                  {match.homeScore} - {match.awayScore}
                </Text>

                <Divider style={{ margin: "12px 0" }} />

                <Text strong>Date: </Text>
                <Text>{new Date(match.startAt).toLocaleString()}</Text>
              </Space>
            </Card>
          </List.Item>
        )}
        locale={{ emptyText: "Aucun match disponible" }}
      />

      <Modal
        title={`Éditer Match #${selectedMatch?.id}`}
        visible={!!selectedMatch}
        onCancel={closeMatchDetails}
        footer={null}
        width={800}
        destroyOnClose
      >
        {selectedMatch && (
          <MatchEditor
            match={selectedMatch}
            onClose={closeMatchDetails}
            onUpdate={loadMatches}
          />
        )}
      </Modal>
    </div>
  );
}
