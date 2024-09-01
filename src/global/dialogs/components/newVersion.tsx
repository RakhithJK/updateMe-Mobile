import * as React from "react";
import { Linking, StyleSheet, View } from "react-native";
import { Button, Dialog, ProgressBar, Text } from "react-native-paper";
import { useDialogs } from "@/states/runtime/dialogs";
import FilesModule from "@/lib/files";
import ReactNativeBlobUtil from "react-native-blob-util";
import Carousel, { CarouselRenderItem } from "react-native-reanimated-carousel";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@/theme";
import { interpolate, useTranslations } from "@/states/persistent/translations";
import { useApp } from "@/states/fetched/app";

const renderCarouselItem: CarouselRenderItem<{
  title: string;
  description: string;
}> = ({ item }) => (
  <View key={item.title} style={styles.carouselItem}>
    <Text variant="titleMedium" style={styles.carouselTitle}>
      {item.title}
    </Text>
    <Text variant="bodyMedium" style={styles.carouselDescription}>
      {item.description}
    </Text>
  </View>
);

const NewVersionDialog = () => {
  const activeDialog = useDialogs((state) => state.activeDialog);
  const latestApp = useApp((state) => state.latest);
  const translations = useTranslations((state) => state.translations);
  const { schemedTheme } = useTheme();
  const [progress, setProgress] = React.useState(0);
  const progressHeight = useSharedValue(0);

  const handleUpdate = React.useCallback(async () => {
    progressHeight.value = withTiming(10, { duration: 500 });
    setProgress(0);
    const fileName = `UpdateMe_v${latestApp.version}.apk`;
    const path = FilesModule.buildAbsolutePath(fileName);
    await ReactNativeBlobUtil.fs.unlink(path).catch(() => {});
    FilesModule.downloadFile(latestApp.download, fileName, path, (progress) => {
      setProgress(progress);
    }).then((res) => {
      setProgress(1);
      FilesModule.installApk(res.path());
      progressHeight.value = withTiming(0, { duration: 500 }, () => {
        setProgress(0);
      });
    });
  }, [latestApp.download, latestApp.version]);

  const handleManualUpdate = React.useCallback(() => {
    Linking.openURL(latestApp.download);
  }, [latestApp.download]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: 300,
    marginBottom: -25,
    height: progressHeight.value,
    overflow: "hidden",
  }));

  const title = React.useMemo(
    () =>
      interpolate(
        translations["Update Me v$1 is available!"],
        latestApp.version
      ),
    [latestApp.version, translations]
  );

  if (activeDialog !== "newVersion") return null;

  return (
    <Dialog
      visible
      dismissable={false}
      dismissableBackButton={false}
      onDismiss={() => {}}
      style={styles.dialog}
    >
      <Dialog.Title>{title}</Dialog.Title>
      <Dialog.Content style={styles.content}>
        <View style={styles.carouselContainer}>
          <Carousel
            width={300}
            height={100}
            loop
            autoPlay={true}
            autoPlayInterval={4000}
            data={latestApp.releaseNotes}
            renderItem={renderCarouselItem}
          />
          <Animated.View style={progressBarStyle}>
            <ProgressBar
              animatedValue={progress}
              color={schemedTheme.primary}
              style={styles.progressBar}
            />
          </Animated.View>
        </View>
      </Dialog.Content>
      <Dialog.Actions style={styles.actions}>
        <Button onPress={handleManualUpdate}>
          {translations["Download manually"]}
        </Button>
        <Button onPress={handleUpdate}>{translations["Update"]}</Button>
      </Dialog.Actions>
    </Dialog>
  );
};

const styles = StyleSheet.create({
  dialog: {
    position: "relative",
  },
  content: {
    alignItems: "center",
    display: "flex",
    marginTop: 20,
    marginBottom: 20,
    gap: 20,
  },
  carouselContainer: {
    width: 300,
    height: 100,
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "space-evenly",
    display: "flex",
  },
  carouselItem: {
    width: 300,
    height: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-evenly",
    alignContent: "center",
  },
  carouselTitle: {
    textAlign: "center",
  },
  carouselDescription: {
    textAlign: "center",
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
  },
  actions: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

NewVersionDialog.displayName = "NewVersionDialog";

export default NewVersionDialog;
