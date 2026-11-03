import React, { useState } from 'react';
import { X, Upload, Check, Sparkles, Monitor, Cpu, Sun, Moon } from 'lucide-react';
import { Button } from '../ui/Button';
import { profileService } from '../../services/profileService';

export const BANNER_PRESETS = [
  {
    id: 'minimalist_desk',
    name: 'Minimalist Workspace Desk',
    category: 'Minimalist Daylight',
    icon: Sun,
    imageUrl: '/banners/minimalist_desk.jpg',
    description: 'Clean bright white desk with laptop, green potted plant and succulent in soft daylight',
  },
  {
    id: 'monstera_workspace',
    name: 'Scandinavian Monstera Studio',
    category: 'Minimalist Daylight',
    icon: Sun,
    imageUrl: '/banners/monstera_workspace.jpg',
    description: 'Airy wooden desk with lush green monstera plant, silver laptop, coffee cup & morning window light',
  },
  {
    id: 'bright_minimal_plants',
    name: 'Bright Studio with Plants',
    category: 'Modern Scandinavian',
    icon: Sun,
    imageUrl: '/banners/bright_minimal_plants.jpg',
    description: 'Large window daylight, tall fiddle leaf fig plant, white standing desk with laptop',
  },
  {
    id: 'dev_workspace',
    name: 'Ultrawide Code Workstation',
    category: 'Developer Workspace',
    icon: Monitor,
    imageUrl: '/banners/dev_workspace.jpg',
    description: 'Curved ultrawide monitor displaying real code, backlit keyboard, coffee mug & luxury desk',
  },
  {
    id: 'cyber_hardware',
    name: 'AI Neural Hardware Lab',
    category: 'Future Tech',
    icon: Cpu,
    imageUrl: '/banners/cyber_hardware.jpg',
    description: 'Holographic neural net, laptop, custom circuit board & server infrastructure',
  },
  {
    id: 'minimal_studio',
    name: 'Architect Penthouse Studio',
    category: 'Daylight Minimalist',
    icon: Sun,
    imageUrl: '/banners/minimal_studio.jpg',
    description: 'Bright daylight penthouse studio overlooking city skyline, code laptop & architecture notebook',
  },
  {
    id: 'night_code_rig',
    name: 'Triple-Monitor Cockpit',
    category: 'Battle Station',
    icon: Moon,
    imageUrl: '/banners/night_code_rig.jpg',
    description: 'Triple-screen developer cockpit at night, water-cooled PC rig & ambient lighting',
  },
];

export const BannerPickerModal = ({
  isOpen,
  onClose,
  currentBanner,
  onSelectBanner,
  userName = "Developer",
  userRole = "developer",
}) => {
  const [activeTab, setActiveTab] = useState('presets');
  const [selectedPreset, setSelectedPreset] = useState(
    BANNER_PRESETS.find((p) => p.imageUrl === currentBanner) || BANNER_PRESETS[0]
  );
  const [customImage, setCustomImage] = useState(
    currentBanner && currentBanner.startsWith('data:') ? currentBanner : null
  );
  const [previewBanner, setPreviewBanner] = useState(
    currentBanner || BANNER_PRESETS[0].imageUrl
  );
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset);
    setPreviewBanner(preset.imageUrl);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        alert('Image must be under 8MB');
        return;
      }
      setIsUploading(true);
      try {
        const uploadRes = await profileService.uploadImage(file);
        if (uploadRes?.url) {
          setCustomImage(uploadRes.url);
          setPreviewBanner(uploadRes.url);
        } else {
          throw new Error('No URL returned');
        }
      } catch {
        // Fallback to local FileReader preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setCustomImage(reader.result);
          setPreviewBanner(reader.result);
        };
        reader.readAsDataURL(file);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleApply = () => {
    if (activeTab === 'upload' && customImage) {
      onSelectBanner(customImage);
    } else if (selectedPreset) {
      onSelectBanner(selectedPreset.imageUrl);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white rounded-3custom border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary-50 text-primary-600 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Choose Profile Banner
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Choose a photorealistic developer setup or upload custom artwork from your device
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview Bar */}
        <div className="p-5 pb-0">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Live Banner Preview
          </p>
          <div className="h-32 sm:h-44 w-full rounded-2xl relative overflow-hidden border border-slate-200 shadow-inner flex items-end p-4 group">
            <img
              src={previewBanner}
              alt="Banner Preview"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
            <div className="relative z-10 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-white shadow-xl bg-white/95 flex items-center justify-center font-black text-xs text-slate-900 uppercase">
                {userName?.slice(0, 2) || (userRole === "client" ? "CL" : "DV")}
              </div>
              <div className="text-white drop-shadow-md">
                <p className="text-sm font-extrabold leading-tight">{userName}</p>
                <p className="text-[11px] text-white/90 font-medium">
                  {activeTab === 'upload' && customImage
                    ? 'Custom Uploaded Artwork'
                    : selectedPreset?.name || 'Selected Atmosphere Banner'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 pt-4 flex gap-2 border-b border-slate-100">
          <button
            onClick={() => {
              setActiveTab('presets');
              if (selectedPreset) setPreviewBanner(selectedPreset.imageUrl);
            }}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'presets'
                ? 'border-primary-500 text-primary-600 bg-primary-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            Developer Workspaces ({BANNER_PRESETS.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('upload');
              if (customImage) setPreviewBanner(customImage);
            }}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'upload'
                ? 'border-primary-500 text-primary-600 bg-primary-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload from Device
          </button>
        </div>

        {/* Tab Contents (Scrollable) */}
        <div className="p-5 overflow-y-auto flex-1">
          {activeTab === 'presets' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {BANNER_PRESETS.map((preset) => {
                const isSelected = selectedPreset?.id === preset.id && activeTab === 'presets';
                const IconComponent = preset.icon;
                return (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`group relative p-3 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary-500 ring-2 ring-primary-500/20 bg-primary-50/20 shadow-md'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-md bg-white'
                    }`}
                  >
                    <div className="h-28 w-full rounded-xl relative overflow-hidden mb-2.5 shadow-xs">
                      <img
                        src={preset.imageUrl}
                        alt={preset.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                      {isSelected && (
                        <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-lg ring-2 ring-white">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1">
                        <IconComponent className="w-3 h-3 text-rose-400" />
                        {preset.category}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="pr-2">
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                          {preset.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {preset.description}
                        </p>
                      </div>
                      <span className="text-[11px] font-bold text-primary-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        Select
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-4">
              <label className="border-2 border-dashed border-slate-300 hover:border-primary-500 rounded-3custom p-10 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-50/50 hover:bg-primary-50/10 group">
                <div className="p-4 rounded-2xl bg-white shadow-md border border-slate-200 text-primary-500 group-hover:scale-110 transition-transform mb-3">
                  <Upload className="w-7 h-7" />
                </div>
                <p className="text-sm font-bold text-slate-900 group-hover:text-primary-600">
                  Click to browse from your device
                </p>
                <p className="text-xs text-slate-400 mt-1 text-center max-w-sm">
                  Upload any developer banner, custom photography, or 3D artwork (PNG, JPG, WebP up to 8MB)
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {customImage && (
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-white flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <img
                      src={customImage}
                      alt="Custom preview"
                      className="w-20 h-12 object-cover rounded-xl border border-slate-200 shadow-xs"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Custom Image Loaded</p>
                      <p className="text-[10px] text-emerald-600 font-semibold">Ready to apply to your profile</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCustomImage(null);
                      setPreviewBanner(selectedPreset?.imageUrl || BANNER_PRESETS[0].imageUrl);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end gap-2.5">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleApply} className="gap-1.5 shadow-md shadow-primary-500/25">
            <Check className="w-4 h-4" />
            Apply Banner
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BannerPickerModal;
