import React, { useState, useEffect, useRef } from 'react';
import { X, Globe, Save, Upload, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { toast } from 'react-toastify';

const SECTION_FIELDS = [
  {
    sectionKey: 'section_hero',
    section: 'Hero',
    fields: [
      { key: 'hero_badge', label: 'Hero Badge' },
      { key: 'hero_tag', label: 'Hero Tag' },
      { key: 'hero_title_1', label: 'Hero Title 1' },
      { key: 'hero_title_2', label: 'Hero Title 2' },
      { key: 'hero_desc', label: 'Hero Description', isTextArea: true },
      { key: 'hero_est', label: 'Hero EST' }
    ]
  },
  {
    sectionKey: 'section_brand_story',
    section: 'Brand Story',
    fields: [
      { key: 'story_badge', label: 'Story Badge' },
      { key: 'story_title_1', label: 'Story Title 1' },
      { key: 'story_title_2', label: 'Story Title 2' },
      { key: 'story_title_3', label: 'Story Title 3' },
      { key: 'story_since', label: 'Story Since' },
      { key: 'story_p1', label: 'Paragraph 1', isTextArea: true },
      { key: 'story_p2', label: 'Paragraph 2', isTextArea: true },
      { key: 'story_p3', label: 'Paragraph 3', isTextArea: true }
    ]
  },
  {
    sectionKey: 'section_values',
    section: 'Values & Principles',
    fields: [
      { key: 'values_badge', label: 'Values Badge' },
      { key: 'values_title_1', label: 'Values Title 1' },
      { key: 'values_title_2', label: 'Values Title 2' }
    ]
  },
  {
    sectionKey: 'section_milestones',
    section: 'Milestones (Timeline)',
    fields: [
      { key: 'timeline_badge', label: 'Timeline Badge' },
      { key: 'timeline_title_1', label: 'Timeline Title 1' },
      { key: 'timeline_title_2', label: 'Timeline Title 2' }
    ]
  },
  {
    sectionKey: 'section_team',
    section: 'Team',
    fields: [
      { key: 'team_badge', label: 'Team Badge' },
      { key: 'team_title_1', label: 'Team Title 1' },
      { key: 'team_title_2', label: 'Team Title 2' },
      { key: 'founder_title', label: 'Founder Title' }
    ]
  },
  {
    sectionKey: 'section_cta',
    section: 'CTA',
    fields: [
      { key: 'cta_badge', label: 'CTA Badge' },
      { key: 'cta_title_1', label: 'CTA Title 1' },
      { key: 'cta_title_2', label: 'CTA Title 2' },
      { key: 'cta_desc', label: 'CTA Description', isTextArea: true },
      { key: 'shop_now', label: 'Shop Now Button Text' }
    ]
  }
];

const MAX_FOUNDERS = 3;
const MAX_VALUES = 3;

function FounderPhotoCard({ index, preview, onFileSelect, onRemove, canRemove, t }) {
  const fileRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onFileSelect(index, file);
      } else {
        toast.error(t('system_settings.drop_image_error'));
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(index, e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`w-36 h-36 bg-zinc-900 border-2 border-dashed rounded-lg flex items-center justify-center overflow-hidden relative group cursor-pointer flex-shrink-0 transition-all ${
          isDragOver 
            ? 'border-rose-500 bg-rose-500/10 scale-105' 
            : 'border-zinc-700 hover:border-zinc-500'
        }`}
        onClick={() => fileRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {preview ? (
          <>
            <img src={preview} alt={`Founder ${index + 1}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Upload className="text-white" size={24} />
            </div>
          </>
        ) : (
          <div className="text-center text-zinc-500 group-hover:text-zinc-400 transition-colors px-2">
            <Upload className="mx-auto mb-2" size={20} />
            <span className="text-[10px] leading-tight block">
              {isDragOver ? t('system_settings.drop_here') : t('system_settings.choose_image')}
            </span>
          </div>
        )}
        <input
          type="file"
          ref={fileRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/jpeg,image/png,image/webp"
        />
      </div>
      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
        >
          <Trash2 size={12} />
          <span>{t('system_settings.remove') || 'Remove'}</span>
        </button>
      )}
    </div>
  );
}

export default function EditAboutModal({ isOpen, onClose, initialData, onSave, isSaving, founderImageUrls }) {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('id');
  const [formData, setFormData] = useState({ en: {}, id: {} });

  const [founders, setFounders] = useState([{ name: '', preview: null, file: null }]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [milestones, setMilestones] = useState([]);

  const [values, setValues] = useState([]);

  const allFieldKeys = SECTION_FIELDS.flatMap(s => s.fields.map(f => f.key));

  const getDefaultMilestones = () => {
    const tEn = i18n.getFixedT('en');
    const tId = i18n.getFixedT('id');
    return [
      { year: '2002', title_en: tEn('about.milestone_1_title'), title_id: tId('about.milestone_1_title'), desc_en: tEn('about.milestone_1_desc'), desc_id: tId('about.milestone_1_desc') },
      { year: '2010', title_en: tEn('about.milestone_2_title'), title_id: tId('about.milestone_2_title'), desc_en: tEn('about.milestone_2_desc'), desc_id: tId('about.milestone_2_desc') },
      { year: '2012', title_en: tEn('about.milestone_3_title'), title_id: tId('about.milestone_3_title'), desc_en: tEn('about.milestone_3_desc'), desc_id: tId('about.milestone_3_desc') },
      { year: '2025', title_en: tEn('about.milestone_4_title'), title_id: tId('about.milestone_4_title'), desc_en: tEn('about.milestone_4_desc'), desc_id: tId('about.milestone_4_desc') },
    ];
  };

  const getDefaultValues = () => {
    const tEn = i18n.getFixedT('en');
    const tId = i18n.getFixedT('id');
    return [
      { title_en: tEn('about.value_1_title'), title_id: tId('about.value_1_title'), desc_en: tEn('about.value_1_desc'), desc_id: tId('about.value_1_desc') },
      { title_en: tEn('about.value_2_title'), title_id: tId('about.value_2_title'), desc_en: tEn('about.value_2_desc'), desc_id: tId('about.value_2_desc') },
      { title_en: tEn('about.value_3_title'), title_id: tId('about.value_3_title'), desc_en: tEn('about.value_3_desc'), desc_id: tId('about.value_3_desc') },
    ];
  };

  useEffect(() => {
    if (isOpen) {
      const tEn = i18n.getFixedT('en');
      const tId = i18n.getFixedT('id');

      const defaultsEn = {};
      const defaultsId = {};
      allFieldKeys.forEach(key => {
        defaultsEn[key] = tEn(`about.${key}`);
        defaultsId[key] = tId(`about.${key}`);
      });

      setFormData({
        en: { ...defaultsEn, ...(initialData?.en || {}) },
        id: { ...defaultsId, ...(initialData?.id || {}) }
      });

      const savedValues = initialData?.values;
      if (savedValues && Array.isArray(savedValues) && savedValues.length > 0) {
        setValues(savedValues);
      } else {
        setValues(getDefaultValues());
      }

      const savedMilestones = initialData?.milestones;
      if (savedMilestones && Array.isArray(savedMilestones) && savedMilestones.length > 0) {
        setMilestones(savedMilestones);
      } else {
        setMilestones(getDefaultMilestones());
      }

      const savedFounders = initialData?.founders;
      if (savedFounders && Array.isArray(savedFounders) && savedFounders.length > 0) {
        setFounders(savedFounders.map((f, i) => ({
          name: f.name || '',
          preview: founderImageUrls?.[i] || null,
          file: null
        })));
      } else {
        setFounders([{
          name: initialData?.founder_name || 'Agus Syahrudin',
          preview: founderImageUrls?.[0] || null,
          file: null
        }]);
      }

      setActiveTab('id');
    }
  }, [isOpen, initialData, founderImageUrls]);

  if (!isOpen) return null;

  const handleChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [key]: value
      }
    }));
  };

  const handleFounderFileSelect = (index, file) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFounders(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], preview: ev.target.result, file };
        return updated;
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFounderNameChange = (index, value) => {
    setFounders(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], name: value };
      return updated;
    });
  };

  const handleAddFounder = () => {
    if (founders.length < MAX_FOUNDERS) {
      setFounders(prev => [...prev, { name: '', preview: null, file: null }]);
    }
  };

  const handleRemoveFounder = (index) => {
    setFounders(prev => prev.filter((_, i) => i !== index));
  };

  const handleMilestoneChange = (index, field, value) => {
    setMilestones(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddMilestone = () => {
    setMilestones(prev => [...prev, { year: '', title_en: '', title_id: '', desc_en: '', desc_id: '' }]);
  };

  const handleRemoveMilestone = (index) => {
    setMilestones(prev => prev.filter((_, i) => i !== index));
  };

  const handleValueChange = (index, field, value) => {
    setValues(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddValue = () => {
    if (values.length < MAX_VALUES) {
      setValues(prev => [...prev, { title_en: '', title_id: '', desc_en: '', desc_id: '' }]);
    }
  };

  const handleRemoveValue = (index) => {
    setValues(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsUploadingImage(true);
    try {
      const token = localStorage.getItem('token');

      for (let i = 0; i < founders.length; i++) {
        if (founders[i].file) {
          const fd = new FormData();
          fd.append('founder_image', founders[i].file);
          fd.append('founder_index', i);
          await axios.post(import.meta.env.VITE_API_URL + '/api/admin/settings/founder-image', fd, {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
          });
        }
      }
    } catch (err) {
      console.error('Founder image upload error:', err);
      toast.error(t('system_settings.failed_upload_founder'));
    } finally {
      setIsUploadingImage(false);
    }

    const foundersData = founders.map((f, i) => ({
      name: f.name,
      index: i
    }));

    onSave({ 
      ...formData, 
      founders: foundersData,
      founder_count: founders.length,
      milestones: milestones,
      values: values
    });
  };

  const busy = isSaving || isUploadingImage;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col max-h-[90vh] overflow-hidden shadow-2xl">
        
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900/50">
          <div>
            <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              <Globe className="text-rose-500" size={20} />
              {t('system_settings.about_modal_title')}
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              {t('system_settings.about_modal_desc')}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-zinc-800 bg-zinc-950 px-6 pt-4 gap-2">
          <button
            onClick={() => setActiveTab('id')}
            className={`px-6 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'id' 
                ? 'text-rose-400 border-rose-500 bg-rose-500/10' 
                : 'text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-900'
            }`}
          >
            {t('system_settings.tab_id')}
          </button>
          <button
            onClick={() => setActiveTab('en')}
            className={`px-6 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'en' 
                ? 'text-rose-400 border-rose-500 bg-rose-500/10' 
                : 'text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-900'
            }`}
          >
            {t('system_settings.tab_en')}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar bg-zinc-950">

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-zinc-100 uppercase tracking-widest border-b border-zinc-800 pb-2">
              {t('system_settings.founder_image_label')}
            </h3>
            <p className="text-xs text-zinc-400">
              {t('system_settings.founder_image_desc')} • Max {MAX_FOUNDERS} {t('system_settings.photos')}
            </p>
            
            <div className="flex flex-wrap gap-6 items-start">
              {founders.map((founder, i) => (
                <FounderPhotoCard
                  key={i}
                  index={i}
                  preview={founder.preview}
                  onFileSelect={handleFounderFileSelect}
                  onRemove={handleRemoveFounder}
                  canRemove={founders.length > 1}
                  t={t}
                />
              ))}
              
              {founders.length < MAX_FOUNDERS && (
                <button
                  type="button"
                  onClick={handleAddFounder}
                  className="w-36 h-36 border-2 border-dashed border-zinc-700 rounded-lg flex flex-col items-center justify-center gap-2 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 hover:bg-zinc-900/50 transition-all cursor-pointer"
                >
                  <Plus size={24} />
                  <span className="text-[10px] uppercase tracking-wider">{t('system_settings.add_founder')}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {founders.map((founder, i) => (
                <div key={i} className="space-y-2">
                  <label className="text-xs font-mono tracking-wider text-zinc-400">
                    {t('system_settings.founder_name_label')} {founders.length > 1 ? `#${i + 1}` : ''}
                  </label>
                  <input
                    type="text"
                    value={founder.name}
                    onChange={(e) => handleFounderNameChange(i, e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
                    placeholder={`${t('system_settings.founder_name_label')} ${i + 1}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {SECTION_FIELDS.map((section, idx) => {
            const isMilestoneSection = section.section === 'Milestones (Timeline)';
            const isValuesSection = section.section === 'Values \u0026 Principles';
            return (
              <div key={idx} className="space-y-4">
                <h3 className="text-lg font-bold text-zinc-100 uppercase tracking-widest border-b border-zinc-800 pb-2">
                  {t(`system_settings.${section.sectionKey}`) || section.section}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {section.fields.map((field) => (
                    <div 
                      key={field.key} 
                      className={`space-y-2 ${field.isTextArea ? 'md:col-span-2' : ''}`}
                    >
                      <label className="text-xs font-mono tracking-wider text-zinc-400">
                        {field.label} <span className="text-zinc-700">({field.key})</span>
                      </label>
                      {field.isTextArea ? (
                        <textarea
                          value={formData[activeTab][field.key] || ''}
                          onChange={(e) => handleChange(field.key, e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors min-h-[100px] resize-y"
                          placeholder={t('system_settings.default_value')}
                        />
                      ) : (
                        <input
                          type="text"
                          value={formData[activeTab][field.key] || ''}
                          onChange={(e) => handleChange(field.key, e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
                          placeholder={t('system_settings.default_value')}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {isMilestoneSection && (
                  <div className="space-y-4 mt-4">
                    {milestones.map((ms, msIdx) => (
                      <div key={msIdx} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 space-y-4 relative group">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono tracking-widest text-zinc-500 uppercase">
                            {t('system_settings.milestone_label')} {String(msIdx + 1).padStart(2, '0')}
                          </span>
                          {milestones.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMilestone(msIdx)}
                              className="flex items-center gap-1 px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={12} />
                              <span>{t('system_settings.remove')}</span>
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-mono tracking-wider text-zinc-400">
                              {t('system_settings.milestone_year')}
                            </label>
                            <input
                              type="text"
                              value={ms.year || ''}
                              onChange={(e) => handleMilestoneChange(msIdx, 'year', e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors font-mono"
                              placeholder="2025"
                            />
                          </div>
                          <div className="md:col-span-2 space-y-2">
                            <label className="text-xs font-mono tracking-wider text-zinc-400">
                              {t('system_settings.milestone_title')} ({activeTab === 'id' ? '🇮🇩' : '🇬🇧'})
                            </label>
                            <input
                              type="text"
                              value={activeTab === 'id' ? (ms.title_id || '') : (ms.title_en || '')}
                              onChange={(e) => handleMilestoneChange(msIdx, activeTab === 'id' ? 'title_id' : 'title_en', e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
                              placeholder={t('system_settings.milestone_title_placeholder')}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-mono tracking-wider text-zinc-400">
                            {t('system_settings.milestone_desc')} ({activeTab === 'id' ? '🇮🇩' : '🇬🇧'})
                          </label>
                          <textarea
                            value={activeTab === 'id' ? (ms.desc_id || '') : (ms.desc_en || '')}
                            onChange={(e) => handleMilestoneChange(msIdx, activeTab === 'id' ? 'desc_id' : 'desc_en', e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors min-h-[80px] resize-y"
                            placeholder={t('system_settings.milestone_desc_placeholder')}
                          />
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleAddMilestone}
                      className="w-full py-3 border-2 border-dashed border-zinc-700 rounded-xl flex items-center justify-center gap-2 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 hover:bg-zinc-900/50 transition-all cursor-pointer"
                    >
                      <Plus size={18} />
                      <span className="text-xs uppercase tracking-wider font-medium">{t('system_settings.add_milestone')}</span>
                    </button>
                  </div>
                )}

                {isValuesSection && (
                  <div className="space-y-4 mt-4">
                    {values.map((val, valIdx) => (
                      <div key={valIdx} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 space-y-4 relative group">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono tracking-widest text-zinc-500 uppercase">
                            {t('system_settings.value_label')} {String(valIdx + 1).padStart(2, '0')}
                          </span>
                          {values.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveValue(valIdx)}
                              className="flex items-center gap-1 px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={12} />
                              <span>{t('system_settings.remove')}</span>
                            </button>
                          )}
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-mono tracking-wider text-zinc-400">
                            {t('system_settings.value_title')} ({activeTab === 'id' ? '\ud83c\uddee\ud83c\udde9' : '\ud83c\uddec\ud83c\udde7'})
                          </label>
                          <input
                            type="text"
                            value={activeTab === 'id' ? (val.title_id || '') : (val.title_en || '')}
                            onChange={(e) => handleValueChange(valIdx, activeTab === 'id' ? 'title_id' : 'title_en', e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
                            placeholder={t('system_settings.value_title_placeholder')}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-mono tracking-wider text-zinc-400">
                            {t('system_settings.value_desc')} ({activeTab === 'id' ? '\ud83c\uddee\ud83c\udde9' : '\ud83c\uddec\ud83c\udde7'})
                          </label>
                          <textarea
                            value={activeTab === 'id' ? (val.desc_id || '') : (val.desc_en || '')}
                            onChange={(e) => handleValueChange(valIdx, activeTab === 'id' ? 'desc_id' : 'desc_en', e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors min-h-[80px] resize-y"
                            placeholder={t('system_settings.value_desc_placeholder')}
                          />
                        </div>
                      </div>
                    ))}

                    {values.length < MAX_VALUES && (
                      <button
                        type="button"
                        onClick={handleAddValue}
                        className="w-full py-3 border-2 border-dashed border-zinc-700 rounded-xl flex items-center justify-center gap-2 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 hover:bg-zinc-900/50 transition-all cursor-pointer"
                      >
                        <Plus size={18} />
                        <span className="text-xs uppercase tracking-wider font-medium">{t('system_settings.add_value')} (Max {MAX_VALUES})</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={busy}
            className="px-6 py-2.5 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            {t('system_settings.cancel_btn')}
          </button>
          <button
            onClick={handleSave}
            disabled={busy}
            className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
          >
            {busy ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
            ) : (
              <Save size={18} />
            )}
            <span>{busy ? t('system_settings.saving') : t('system_settings.save_changes')}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
