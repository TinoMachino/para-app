import {forwardRef, useEffect, useImperativeHandle} from 'react'
import {findNodeHandle, View} from 'react-native'

import {List} from '#/view/com/util/List'
import {type ListRef} from '#/view/com/util/List'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import {IS_IOS} from '#/env'
import {type SectionRef} from './types'

interface Props {
  headerHeight: number
  scrollElRef: ListRef
  setScrollViewTag: (tag: number | null) => void
  isFocused: boolean
}

// Mock Data
import {PROFILE_RAQ_HISTORY as MOCK_RAQ} from '#/lib/mock-data'

export const ProfileRAQSection = forwardRef<SectionRef, Props>(
  function ProfileRAQSection(
    {headerHeight, scrollElRef, setScrollViewTag, isFocused},
    ref,
  ) {
    const t = useTheme()

    useImperativeHandle(ref, () => ({
      scrollToTop: () => {
        scrollElRef.current?.scrollToOffset({
          offset: -headerHeight,
          animated: true,
        })
      },
    }))

    useEffect(() => {
      if (IS_IOS && isFocused && scrollElRef.current) {
        // @ts-ignore
        const nativeTag = findNodeHandle(scrollElRef.current)
        setScrollViewTag(nativeTag)
      }
    }, [isFocused, scrollElRef, setScrollViewTag])

    const renderItem = ({item}: {item: (typeof MOCK_RAQ)[0]}) => (
      <View style={[a.p_md, a.border_b, t.atoms.border_contrast_low]}>
        <Text style={[a.text_md, a.font_bold]}>{item.question}</Text>
        <View style={[a.flex_row, a.justify_between, a.mt_xs]}>
          <Text style={[t.atoms.text_contrast_medium]}>
            Answer:{' '}
            <Text style={[a.font_bold, t.atoms.text]}>{item.answer}</Text>
          </Text>
          <Text style={[t.atoms.text_contrast_low]}>{item.score}</Text>
        </View>
      </View>
    )

    return (
      <List
        ref={scrollElRef}
        data={MOCK_RAQ} // In real app, fetch execution
        renderItem={renderItem}
        keyExtractor={item => item.id}
        headerOffset={headerHeight}
        contentContainerStyle={{
          minHeight: '100%',
          paddingBottom: 100,
        }}
      />
    )
  },
)
