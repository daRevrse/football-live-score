import React, { useEffect, useState } from "react";
import {
  Form,
  Select,
  Button,
  Typography,
  Spin,
  Alert,
  Card,
  Divider,
  message,
  Space,
} from "antd";
import { PlusOutlined, TeamOutlined } from "@ant-design/icons";
import { createCompleteMatch, getTeams } from "../services/api";

const { Title } = Typography;
const { Option } = Select;

export default function MatchForm({ onMatchAdded, onCancel }) {
  const [form] = Form.useForm();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await getTeams();
        setTeams(response.data);
      } catch (err) {
        setError("Erreur lors du chargement des équipes");
        console.error(err);
      } finally {
        setTeamsLoading(false);
      }
    };
    fetchTeams();
  }, []);

  const handleSubmit = async (values) => {
    const { homeTeamId, awayTeamId } = values;

    if (homeTeamId === awayTeamId) {
      setError("Veuillez sélectionner deux équipes différentes");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createCompleteMatch(homeTeamId, awayTeamId);
      message.success("Match créé avec succès");
      form.resetFields();
      if (onMatchAdded) onMatchAdded();
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        err.message ||
        "Erreur lors de la création du match";
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filterOption = (input, option) =>
    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0;

  return (
    <Card
      title={
        <Space>
          <TeamOutlined />
          <Title level={4} style={{ margin: 0 }}>
            Ajouter un nouveau match
          </Title>
        </Space>
      }
      style={{ width: "100%", maxWidth: 600 }}
    >
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
          closable
          onClose={() => setError(null)}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ homeTeamId: undefined, awayTeamId: undefined }}
      >
        <Form.Item
          name="homeTeamId"
          label="Équipe à domicile"
          rules={[{ required: true, message: "Sélectionnez une équipe" }]}
        >
          <Select
            placeholder="Sélectionnez l'équipe domicile"
            loading={teamsLoading}
            showSearch
            filterOption={filterOption}
            optionFilterProp="children"
            notFoundContent={
              teamsLoading ? <Spin size="small" /> : "Aucune équipe trouvée"
            }
          >
            {teams.map((team) => (
              <Option key={team.id} value={team.id}>
                {team.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Divider>VS</Divider>

        <Form.Item
          name="awayTeamId"
          label="Équipe à l'extérieur"
          rules={[{ required: true, message: "Sélectionnez une équipe" }]}
        >
          <Select
            placeholder="Sélectionnez l'équipe extérieure"
            loading={teamsLoading}
            showSearch
            filterOption={filterOption}
            optionFilterProp="children"
            notFoundContent={
              teamsLoading ? <Spin size="small" /> : "Aucune équipe trouvée"
            }
          >
            {teams.map((team) => (
              <Option key={team.id} value={team.id}>
                {team.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<PlusOutlined />}
              disabled={teamsLoading}
            >
              Créer le match
            </Button>
            {onCancel && <Button onClick={onCancel}>Annuler</Button>}
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}
