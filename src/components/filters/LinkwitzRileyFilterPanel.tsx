import {
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Slider,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useMemo } from 'react';
import type { FrequencyUnit } from '../Settings';

const NEGATIVE_INFINITY_DB = -100.0;

const gainDbSliderValueToGain = (value: number): number => {
  return value === NEGATIVE_INFINITY_DB ? 0.0 : Math.pow(10, value / 20.0);
};

const gainDbSliderValueToLabel = (
  value: number,
  showUnit: boolean = true,
): string => {
  const numberPart =
    value === NEGATIVE_INFINITY_DB ? '-Infinity' : value.toFixed(2);
  const unitPart = showUnit ? ' dB' : '';

  return `${numberPart}${unitPart}`;
};

const getButtonGroupValue = (dbLow: number, dbHigh: number): string => {
  if (dbLow === 0.0 && dbHigh === NEGATIVE_INFINITY_DB) {
    return 'lowpass';
  } else if (dbLow === NEGATIVE_INFINITY_DB && dbHigh === 0.0) {
    return 'highpass';
  } else if (dbLow === 0.0 && dbHigh === 0.0) {
    return 'mixed';
  } else {
    return 'custom';
  }
};

interface LinkwitzRileyFilterPanelProps {
  onChange: (params: {
    order: number;
    crossoverFrequency: number;
    gainLow: number;
    gainHigh: number;
  }) => void;
  logarithmicFrequency?: boolean;
  frequencyUnit?: FrequencyUnit;
}

/**
 * 角周波数（rad/s）を指定された単位に変換
 */
function convertFrequencyToDisplay(
  omega: number,
  unit: FrequencyUnit = 'radians',
): number {
  if (unit === 'radians') {
    return omega;
  }
  const sampleRate = unit === '44100' ? 44100 : 48000;
  return (omega * sampleRate) / (2 * Math.PI);
}

/**
 * 表示単位から角周波数（rad/s）に変換
 */
function convertFrequencyFromDisplay(
  freq: number,
  unit: FrequencyUnit = 'radians',
): number {
  if (unit === 'radians') {
    return freq;
  }
  const sampleRate = unit === '44100' ? 44100 : 48000;
  return (freq * 2 * Math.PI) / sampleRate;
}

/**
 * 周波数単位のラベルを取得
 */
function getFrequencyLabel(unit: FrequencyUnit = 'radians'): string {
  if (unit === 'radians') {
    return 'rad/s';
  }
  return 'Hz';
}

export const LinkwitzRileyFilterPanel = ({
  onChange,
  logarithmicFrequency = false,
  frequencyUnit = 'radians',
}: LinkwitzRileyFilterPanelProps) => {
  const { t } = useTranslation();
  const [order, setOrder] = useState<number>(4);
  const [crossoverFrequency, setCrossoverFrequency] = useState<number>(
    Math.PI / 4,
  );
  const [gainDbLow, setGainDbLow] = useState<number>(0.0);
  const [gainDbHigh, setGainDbHigh] = useState<number>(0.0);

  // パラメータが変更されたら通知
  useEffect(() => {
    onChange({
      order,
      crossoverFrequency,
      gainLow: gainDbSliderValueToGain(gainDbLow),
      gainHigh: gainDbSliderValueToGain(gainDbHigh),
    });
  }, [order, crossoverFrequency, gainDbLow, gainDbHigh, onChange]);

  // スライダーの範囲（rad/s）
  const minFreqRad = 0.001 * Math.PI;
  const maxFreqRad = Math.PI;

  // 表示単位に変換
  const minFreqDisplay = convertFrequencyToDisplay(minFreqRad, frequencyUnit);
  const maxFreqDisplay = convertFrequencyToDisplay(maxFreqRad, frequencyUnit);

  // 対数スケール用
  const logMin = Math.log10(minFreqDisplay);
  const logMax = Math.log10(maxFreqDisplay);

  const getSliderValue = (freqRad: number): number => {
    const freqDisplay = convertFrequencyToDisplay(freqRad, frequencyUnit);
    if (logarithmicFrequency) {
      return Math.log10(freqDisplay);
    }
    return freqDisplay;
  };

  const getFreqFromSlider = (sliderValue: number): number => {
    let freqDisplay: number;
    if (logarithmicFrequency) {
      freqDisplay = Math.pow(10, sliderValue);
    } else {
      freqDisplay = sliderValue;
    }
    return convertFrequencyFromDisplay(freqDisplay, frequencyUnit);
  };

  // プリミティブ型を返す計算量の少ないコードでは
  // useMemo を使う必要はないのでは？
  const currentButtonGroupValue = useMemo(() => {
    return getButtonGroupValue(gainDbLow, gainDbHigh);
  }, [gainDbLow, gainDbHigh]);

  const handleClickTypeButtonGroup = (
    _: React.MouseEvent<HTMLElement>,
    type: string | null,
  ) => {
    if (type === null) return;
    if (type === 'lowpass') {
      setGainDbLow(0.0);
      setGainDbHigh(NEGATIVE_INFINITY_DB);
    } else if (type === 'highpass') {
      setGainDbLow(NEGATIVE_INFINITY_DB);
      setGainDbHigh(0.0);
    } else if (type === 'mixed') {
      setGainDbLow(0.0);
      setGainDbHigh(0.0);
    } else if (type === 'custom') {
      if (getButtonGroupValue(gainDbLow, gainDbHigh) !== 'custom') {
        setGainDbLow(-20.0);
        setGainDbHigh(0.0);
      } else {
        // do nothing
      }
    } else {
      console.error(`Invalid LinkwitzRiley filter type: ${type}`);
    }
    // 'custom' does nothing (user adjusts via sliders)
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        {t('filters.linkwitzRiley.type')}
      </Typography>
      <ToggleButtonGroup
        value={currentButtonGroupValue}
        exclusive
        onChange={handleClickTypeButtonGroup}
        fullWidth
        size="small"
        sx={{ mb: 2 }}
      >
        <ToggleButton value="lowpass">
          {t('filters.linkwitzRiley.lowPass')}
        </ToggleButton>
        <ToggleButton value="highpass">
          {t('filters.linkwitzRiley.highPass')}
        </ToggleButton>
        <ToggleButton value="mixed">
          {t('filters.linkwitzRiley.mixed')}
        </ToggleButton>
        <ToggleButton value="custom">
          {t('filters.linkwitzRiley.custom')}
        </ToggleButton>
      </ToggleButtonGroup>

      <Typography variant="subtitle2" gutterBottom>
        {t('filters.linkwitzRiley.order')}: {order}
      </Typography>
      <Slider
        value={order}
        onChange={(_, value) => setOrder(value as number)}
        min={2}
        max={12}
        step={2}
        marks
        valueLabelDisplay="auto"
        sx={{ mb: 2 }}
      />

      <Typography variant="subtitle2" gutterBottom>
        {t('filters.linkwitzRiley.crossoverFrequency')}:{' '}
        {convertFrequencyToDisplay(crossoverFrequency, frequencyUnit).toFixed(
          frequencyUnit === 'radians' ? 3 : 1,
        )}{' '}
        ({getFrequencyLabel(frequencyUnit)})
      </Typography>
      <Slider
        value={getSliderValue(crossoverFrequency)}
        onChange={(_, value) =>
          setCrossoverFrequency(getFreqFromSlider(value as number))
        }
        min={logarithmicFrequency ? logMin : minFreqDisplay}
        max={logarithmicFrequency ? logMax : maxFreqDisplay}
        step={
          logarithmicFrequency ? 0.01 : frequencyUnit === 'radians' ? 0.001 : 10
        }
        scale={logarithmicFrequency ? (x) => Math.pow(10, x) : undefined}
        valueLabelDisplay="auto"
        valueLabelFormat={(value) =>
          value.toFixed(frequencyUnit === 'radians' ? 3 : 0)
        }
        sx={{ mb: 2 }}
      />

      <Typography variant="subtitle2" gutterBottom>
        {t('filters.linkwitzRiley.gainLow')}:{' '}
        {gainDbSliderValueToLabel(gainDbLow, true)}
      </Typography>
      <Slider
        value={gainDbLow}
        onChange={(_, value) => setGainDbLow(value as number)}
        min={NEGATIVE_INFINITY_DB}
        max={0.0}
        step={0.1}
        valueLabelDisplay="auto"
        valueLabelFormat={(value) =>
          gainDbSliderValueToLabel(value as number, false)
        }
        sx={{ mb: 2 }}
      />

      <Typography variant="subtitle2" gutterBottom>
        {t('filters.linkwitzRiley.gainHigh')}:{' '}
        {gainDbSliderValueToLabel(gainDbHigh, true)}
      </Typography>
      <Slider
        value={gainDbHigh}
        onChange={(_, value) => setGainDbHigh(value as number)}
        min={NEGATIVE_INFINITY_DB}
        max={0.0}
        step={0.1}
        valueLabelDisplay="auto"
        valueLabelFormat={(value) =>
          gainDbSliderValueToLabel(value as number, false)
        }
        sx={{ mb: 2 }}
      />

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        {t('filters.linkwitzRiley.description')}
      </Typography>
    </Box>
  );
};
