import {useCallback, useState} from 'react'
import {ActivityIndicator, ScrollView, View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {useFocusEffect} from '@react-navigation/native'

import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {usePoliticalAffiliation} from '#/state/shell/political-affiliation'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a, useTheme} from '#/alf'
import {Check_Stroke2_Corner0_Rounded as CheckIcon} from '#/components/icons/Check'
import * as Layout from '#/components/Layout'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'PoliticalAffiliation'
>

// Political parties and communities available for selection
const AFFILIATIONS = [
  // Traditional Parties
  {name: 'Morena', color: '#8B0000'},
  {name: 'PAN', color: '#005EB8'},
  {name: 'PRI', color: '#CC0000'},
  {name: 'MC', color: '#FF6600'},
  {name: 'PT', color: '#CC0000'},
  {name: 'PVEM', color: '#00AA00'},
  // Political Compass Quadrants
  {name: 'Auth Left', color: '#FF4444'},
  {name: 'Lib Left', color: '#44FF44'},
  {name: 'Auth Right', color: '#4444FF'},
  {name: 'Lib Right', color: '#FFFF44'},
  {name: 'Center Left', color: '#FF8888'},
  {name: 'Center Right', color: '#8888FF'},
  {name: 'Lib Center', color: '#88FF88'},
  {name: 'Auth Econocenter', color: '#AA88AA'},
  {name: 'Lib Econocenter', color: '#88AAAA'},
  // Issue-based Communities
  {name: 'Environment', color: '#228B22'},
  {name: 'Mobility', color: '#4169E1'},
  {name: 'Community', color: '#9932CC'},
]

export function PoliticalAffiliationScreen({}: Props) {
  const t = useTheme()
  const {_} = useLingui()
  const {affiliation, setAffiliation, isLoading} = usePoliticalAffiliation()
  const [localAffiliation, setLocalAffiliation] = useState<string | null>(null)

  useFocusEffect(
    useCallback(() => {
      setLocalAffiliation(affiliation)
    }, [affiliation]),
  )

  const handleSelect = async (name: string) => {
    // Treat empty string as clearing the affiliation
    const newValue =
      name === '' ? null : localAffiliation === name ? null : name
    setLocalAffiliation(newValue)
    await setAffiliation(newValue)
    if (newValue) {
      Toast.show(_(msg`Political affiliation set to ${name}`))
    } else {
      Toast.show(_(msg`Political affiliation cleared`))
    }
  }

  if (isLoading) {
    return (
      <View style={[a.flex_1, a.align_center, a.justify_center]}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Political Affiliation</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        <ScrollView>
          <SettingsList.Container>
            <View style={[a.px_lg, a.py_md]}>
              <Text
                style={[
                  a.text_sm,
                  a.leading_snug,
                  t.atoms.text_contrast_medium,
                ]}>
                <Trans>
                  Select your political affiliation. This helps personalize your
                  feed and connect you with like-minded users. Your selection is
                  stored locally on this device.
                </Trans>
              </Text>
            </View>

            <SettingsList.Divider />

            {/* None option to clear affiliation */}
            <SettingsList.PressableItem
              label={_(msg`None`)}
              onPress={() => handleSelect('')}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: '#888888',
                  marginRight: 8,
                }}
              />
              <SettingsList.ItemText style={[a.flex_1]}>
                <Trans>None (Clear affiliation)</Trans>
              </SettingsList.ItemText>
              {!localAffiliation && (
                <CheckIcon size="md" style={[t.atoms.text]} />
              )}
            </SettingsList.PressableItem>

            <SettingsList.Divider />

            <View style={[a.py_sm]}>
              <Text
                style={[
                  a.px_lg,
                  a.py_sm,
                  a.text_xs,
                  a.font_bold,
                  t.atoms.text_contrast_low,
                ]}>
                <Trans>POLITICAL PARTIES</Trans>
              </Text>
              {AFFILIATIONS.filter(aff =>
                ['Morena', 'PAN', 'PRI', 'MC', 'PT', 'PVEM'].includes(aff.name),
              ).map(aff => (
                <SettingsList.PressableItem
                  key={aff.name}
                  label={aff.name}
                  onPress={() => handleSelect(aff.name)}>
                  <View
                    style={[
                      {
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: aff.color,
                        marginRight: 8,
                      },
                    ]}
                  />
                  <SettingsList.ItemText style={[a.flex_1]}>
                    {aff.name}
                  </SettingsList.ItemText>
                  {localAffiliation === aff.name && (
                    <CheckIcon size="md" style={[t.atoms.text]} />
                  )}
                </SettingsList.PressableItem>
              ))}
            </View>

            <SettingsList.Divider />

            <View style={[a.py_sm]}>
              <Text
                style={[
                  a.px_lg,
                  a.py_sm,
                  a.text_xs,
                  a.font_bold,
                  t.atoms.text_contrast_low,
                ]}>
                <Trans>POLITICAL COMPASS</Trans>
              </Text>
              {AFFILIATIONS.filter(aff =>
                [
                  'Auth Left',
                  'Lib Left',
                  'Auth Right',
                  'Lib Right',
                  'Center Left',
                  'Center Right',
                  'Lib Center',
                  'Auth Econocenter',
                  'Lib Econocenter',
                ].includes(aff.name),
              ).map(aff => (
                <SettingsList.PressableItem
                  key={aff.name}
                  label={aff.name}
                  onPress={() => handleSelect(aff.name)}>
                  <View
                    style={[
                      {
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: aff.color,
                        marginRight: 8,
                      },
                    ]}
                  />
                  <SettingsList.ItemText style={[a.flex_1]}>
                    {aff.name}
                  </SettingsList.ItemText>
                  {localAffiliation === aff.name && (
                    <CheckIcon size="md" style={[t.atoms.text]} />
                  )}
                </SettingsList.PressableItem>
              ))}
            </View>
          </SettingsList.Container>
        </ScrollView>
      </Layout.Content>
    </Layout.Screen>
  )
}
