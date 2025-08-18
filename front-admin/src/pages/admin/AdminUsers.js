import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, Select, message } from "antd";
import { useAuth } from "../../context/AuthContext";
import { createUser, getUsers, updateUser } from "../../services/api";
import { User, Edit, Trash2, Plus } from "lucide-react";

const { Option } = Select;

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [form] = Form.useForm();
  const { user: currentAdmin } = useAuth();

  const columns = [
    {
      title: "Nom d'utilisateur",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Rôle",
      dataIndex: "role",
      key: "role",
      render: (role) => (
        <span
          style={{
            color:
              role === "Admin"
                ? "#f5222d"
                : role === "Reporter"
                ? "#1890ff"
                : "#52c41a",
          }}
        >
          {role}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div style={{ display: "flex", gap: "8px" }}>
          <Button
            icon={<Edit size={16} />}
            onClick={() => editUser(record)}
            disabled={record.id === currentAdmin?.id}
          />
          <Button
            danger
            icon={<Trash2 size={16} />}
            onClick={() => deleteUser(record.id)}
            disabled={record.id === currentAdmin?.id}
          />
        </div>
      ),
    },
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await getUsers({ page: 1, limit: 10 });
      setUsers(response.data.users);
      setLoading(false);
    } catch (error) {
      message.error("Erreur lors du chargement des utilisateurs");
      setLoading(false);
    }
  };

  const showModal = () => {
    setIsModalVisible(true);
    form.resetFields();
    setCurrentUser(null);
  };

  const editUser = (user) => {
    setCurrentUser(user);
    form.setFieldsValue({
      username: user.username,
      email: user.email,
      role: user.role,
    });
    setIsModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (currentUser) {
        // await api.put(`/admin/users/${currentUser.id}`, values);
        await updateUser(currentUser.id, values);
        message.success("Utilisateur mis à jour avec succès");
      } else {
        // await api.post("/admin/users", values);
        await createUser(values);
        message.success("Utilisateur créé avec succès");
      }

      setIsModalVisible(false);
      fetchUsers();
    } catch (error) {
      message.error(error.response?.data?.message || "Une erreur est survenue");
    }
  };

  const deleteUser = async (userId) => {
    try {
      //   await api.delete(`/admin/users/${userId}`);
      await deleteUser(userId);
      message.success("Utilisateur supprimé avec succès");
      fetchUsers();
    } catch (error) {
      message.error("Erreur lors de la suppression");
    }
  };

  return (
    <div style={{ padding: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <h2>Gestion des utilisateurs</h2>
        <Button type="primary" icon={<Plus size={16} />} onClick={showModal}>
          Ajouter un utilisateur
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        loading={loading}
        rowKey="id"
      />

      <Modal
        title={currentUser ? "Modifier utilisateur" : "Nouvel utilisateur"}
        visible={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        okText={currentUser ? "Mettre à jour" : "Créer"}
        cancelText="Annuler"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="username"
            label="Nom d'utilisateur"
            rules={[{ required: true, message: "Ce champ est obligatoire" }]}
          >
            <Input prefix={<User size={14} />} />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Ce champ est obligatoire" },
              { type: "email", message: "Email invalide" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="role"
            label="Rôle"
            rules={[{ required: true, message: "Ce champ est obligatoire" }]}
          >
            <Select>
              <Option value="Admin">Admin</Option>
              <Option value="Reporter">Reporter</Option>
              <Option value="User">User</Option>
            </Select>
          </Form.Item>

          {!currentUser && (
            <Form.Item
              name="password"
              label="Mot de passe"
              rules={[{ required: true, message: "Ce champ est obligatoire" }]}
            >
              <Input.Password />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default AdminUsers;
