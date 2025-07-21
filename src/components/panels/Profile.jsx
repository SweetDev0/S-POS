import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { User, Mail, ShieldCheck, Info, CheckCircle, Trash2, Database, Save, Download, Upload } from "lucide-react";

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const [form, setForm] = useState({ 
    name: user?.name || '', 
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [backups, setBackups] = useState([]);
  const [backupLoading, setBackupLoading] = useState(false);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    setBackupLoading(true);
    try {
      const res = await window.electronAPI.listBackups();
      if (res.success) {
        setBackups(res.backups);
      } else {
        toast.error(res.error || 'Yedekler yüklenemedi.');
      }
    } catch (error) {
      toast.error('Yedekler yüklenirken bir hata oluştu.');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleManualBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await window.electronAPI.createBackup();
      if (res.success && res.backup) {
        toast.success('Manuel yedek başarıyla oluşturuldu!');
        // Add the new backup to the top of the list without re-fetching
        setBackups(prevBackups => [res.backup, ...prevBackups]);
      } else {
        toast.error(res.error || 'Yedek oluşturulamadı.');
      }
    } catch (error) {
      toast.error('Yedek oluşturulurken bir hata oluştu.');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleDownloadBackup = async (backupPath) => {
    try {
      const res = await window.electronAPI.downloadBackup(backupPath);
      if (res.success) {
        toast.success('Yedek başarıyla indirildi!');
      } else {
        toast.error(res.error || 'Yedek indirilemedi.');
      }
    } catch (error) {
      toast.error('Yedek indirilirken bir hata oluştu.');
    }
  };

  const handleImportBackup = async () => {
    if (!window.confirm('Yedek dosyasını yüklemek mevcut verilerinizi tamamen değiştirecek. Devam etmek istiyor musunuz?')) return;
    setBackupLoading(true);
    try {
      const res = await window.electronAPI.importBackup();
      if (res.success) {
        toast.success('Yedek başarıyla yüklendi! Uygulama yeniden başlatılıyor...');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast.error(res.error || 'Yedek yüklenemedi.');
      }
    } catch (error) {
      toast.error('Yedek yüklenirken bir hata oluştu.');
    } finally {
      setBackupLoading(false);
    }
  };

  if (!user) return <LoadingSpinner />;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Sadece isim güncellenebilir
      const updateData = { name: form.name };
      const result = await updateUser(updateData);
      if (result.success) {
        setForm({ ...form, password: '' });
        toast.success('Profil güncellendi');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Profil güncellenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    setDeleteLoading(true);
    try {
      if (deletePassword.length < 6) {
        toast.error('Şifre en az 6 karakter olmalıdır');
        return;
      }
      if (!window.confirm('Hesabınızı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
        return;
      }
      toast.success('Hesabınız silindi.');
      logout();
    } catch (error) {
      console.error('Delete account error:', error);
      toast.error('Hesap silinirken hata oluştu');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-start min-h-screen bg-gray-50 py-12 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 relative flex flex-col">
        <div className="p-8 border-b">
          <Link to="/dashboard" className="absolute left-4 top-4 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition shadow-sm text-sm">
            ← Geri
          </Link>
          <div className="flex flex-col items-center mt-8">
            <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-4xl font-bold text-blue-600 shadow-md mb-4">
              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">Profilim</h2>
            <p className="text-gray-500 mt-1">Kişisel bilgilerinizi ve ayarlarınızı yönetin</p>
          </div>
        </div>

        <div className="p-8 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
          {/* User Info Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <User className="w-4 h-4 text-blue-400" /> İsim
              </label>
              <input 
                name="name" 
                value={form.name} 
                onChange={handleChange} 
                required 
                className="px-3 py-2 border rounded-lg w-full focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-gray-50 shadow-sm" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Mail className="w-4 h-4 text-blue-400" /> E-posta
              </label>
              <input 
                value={user.email} 
                disabled 
                className="px-3 py-2 border rounded-lg w-full bg-gray-100 text-gray-500 shadow-sm" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-blue-400" /> Rol
              </label>
              <input 
                value={user.role || 'user'} 
                disabled 
                className="px-3 py-2 border rounded-lg w-full bg-gray-100 text-gray-500 shadow-sm" 
              />
              {user.email === 'miracege0201@hotmail.com' && user.role === 'admin' && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-400" /> Admin hesabı - Tüm yetkilere sahipsiniz
                </p>
              )}
              {user.email !== 'miracege0201@hotmail.com' && (
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <Info className="w-4 h-4 text-gray-300" /> Sadece admin hesabı rol değiştirebilir
                </p>
              )}
            </div>
            <button 
              type="submit" 
              disabled={loading} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition disabled:opacity-50 shadow"
            >
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </form>

          {/* Backup Section */}
          <div className="mt-10 w-full border-t pt-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-gray-500" />
              Veri Yedekleme
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Uygulama her açıldığında otomatik olarak bir yedek alınır. Ayrıca manuel olarak da yedek alabilirsiniz.
            </p>
            <button
              onClick={handleManualBackup}
              disabled={backupLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 mb-2"
            >
              <Save className="w-4 h-4" />
              {backupLoading ? 'Yedekleniyor...' : 'Manuel Yedek Al'}
            </button>
            <button
              onClick={handleImportBackup}
              disabled={backupLoading}
              className="btn-secondary w-full flex items-center justify-center gap-2 mb-4"
            >
              <Upload className="w-4 h-4" />
              Yedek Yükle (Import)
            </button>
            <div className="mt-4">
              <h4 className="font-semibold text-gray-700 mb-2">Mevcut Yedekler ({backups.length})</h4>
              {backupLoading && backups.length === 0 ? (
                <p className="text-sm text-gray-400">Yedekler yükleniyor...</p>
              ) : backups.length === 0 ? (
                <p className="text-sm text-gray-400">Henüz yedek oluşturulmamış.</p>
              ) : (
                <ul className="space-y-2 max-h-48 overflow-y-auto bg-gray-50 p-3 rounded-lg border">
                  {backups.map(backup => (
                    <li key={backup.name} className="text-sm text-gray-600 flex justify-between items-center">
                      <span>{backup.name}</span>
                      <span className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{(backup.size / 1024).toFixed(2)} KB</span>
                        <button
                          onClick={() => handleDownloadBackup(backup.path)}
                          className="p-1 rounded hover:bg-gray-200 transition"
                          title="Yedeği indir"
                        >
                          <Download className="w-4 h-4 text-blue-500" />
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          
          {/* Delete Account Section */}
          <div className="mt-10 w-full border-t pt-8">
            <h3 className="text-xl font-bold text-red-600 mb-2">Hesabı Sil</h3>
            <button 
              onClick={() => setShowDelete((v) => !v)} 
              className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 font-semibold transition w-full border border-red-200 shadow flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4 text-red-400" /> Hesabı Silme Alanını Göster
            </button>
            {showDelete && (
              <form onSubmit={handleDelete} className="mt-4 bg-red-50 p-4 rounded-xl border border-red-200 flex flex-col gap-2 animate-fade-in">
                <label className="text-sm font-medium text-red-700">
                  Hesabınızı kalıcı olarak silmek için şifrenizi girin:
                </label>
                <input 
                  type="password" 
                  value={deletePassword} 
                  onChange={e => setDeletePassword(e.target.value)} 
                  className="px-3 py-2 border rounded-lg w-full focus:ring-2 focus:ring-red-400 focus:border-red-400 bg-white" 
                  minLength={6} 
                  required 
                />
                <button 
                  type="submit" 
                  disabled={deleteLoading} 
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition disabled:opacity-50 shadow"
                >
                  {deleteLoading ? 'Siliniyor...' : 'Hesabı Kalıcı Olarak Sil'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 